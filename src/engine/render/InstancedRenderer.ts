/**
 * F1.04 — custom WebGL2 instanced renderer. Mesh buffers are uploaded once;
 * one shared instance buffer is resized exponentially. Opaque submissions
 * batch by mesh+material; transparency remains globally back-to-front.
 */
import type { Geometry } from "../../art/mesh/Primitives";
import { validateGeometry } from "../../art/mesh/Primitives";
import type { MaterialToken, LinearRgb } from "./Palette";
import { linearColor, vertexMaterialColor } from "./Palette";
import { GpuResources } from "./GpuResources";
import { SunShadowPass, SHADOW_MAP_SIZE, createSunViewProjection } from "./SunShadowPass";
import { aabbIntersectsFrustum } from "./Frustum";

export interface RenderInstance {
  readonly meshId: string;
  readonly material: MaterialToken;
  /** Column-major gl-matrix mat4. */
  readonly model: ArrayLike<number>;
  readonly opacity?: number;
}
export interface CameraMatrices {
  readonly view: ArrayLike<number>;
  readonly viewProjection: ArrayLike<number>;
}
export interface RenderStats {
  readonly submitted: number;
  /** Color-pass instances, excluding zero-opacity and camera-culled objects. */
  readonly instances: number;
  readonly culled: number;
  readonly drawCalls: number;
  /** Shadow-depth work is separate from color draw calls and not GPU frame time. */
  readonly shadowDrawCalls: number;
  readonly shadowInstances: number;
  readonly shadowTriangles: number;
  /** GPU allocation estimate, NOT driver memory usage or VRAM profiling. */
  readonly estimatedGpuBytes: number;
  readonly opaqueDrawCalls: number;
  readonly transparentDrawCalls: number;
  readonly triangles: number;
  /** CPU-side submission time; not a GPU timing measurement. */
  readonly cpuMilliseconds: number;
  readonly instanceCapacity: number;
}
interface GpuMesh {
  readonly vao: WebGLVertexArrayObject;
  readonly indexCount: number;
  readonly indexType: number;
  readonly bounds: Geometry["bounds"];
}
interface Prepared {
  readonly meshId: string;
  readonly material: MaterialToken;
  readonly model: ArrayLike<number>;
  readonly color: LinearRgb;
  readonly opacity: number;
  readonly viewZ: number;
  readonly sequence: number;
}

const FLOATS_PER_INSTANCE = 20; // mat4 (16) + linear RGB and alpha (4)
const INITIAL_INSTANCE_CAPACITY = 8;

// Explicit layout requires 8 of WebGL2's minimum 16 vertex attribute slots.
export const VERTEX_SHADER = [
  "#version 300 es",
  "precision highp float;",
  "layout(location = 0) in vec3 aPosition;",
  "layout(location = 1) in vec3 aNormal;",
  "layout(location = 2) in vec4 aModel0;",
  "layout(location = 3) in vec4 aModel1;",
  "layout(location = 4) in vec4 aModel2;",
  "layout(location = 5) in vec4 aModel3;",
  "layout(location = 6) in vec4 aInstanceColor;",
  "layout(location = 7) in vec3 aVertexColor;",
  "uniform mat4 uViewProjection;",
  "uniform mat4 uSunViewProjection;",
  "out vec3 vNormal;",
  "out vec3 vLinearColor;",
  "out float vAlpha;",
  "out vec4 vSunPosition;",
  "void main() {",
  "  mat4 model = mat4(aModel0, aModel1, aModel2, aModel3);",
  "  vec4 world = model * vec4(aPosition, 1.0);",
  "  gl_Position = uViewProjection * world;",
  "  vSunPosition = uSunViewProjection * world;",
  "  vNormal = normalize(transpose(inverse(mat3(model))) * aNormal);",
  "  vLinearColor = aVertexColor.r < 0.0 ? aInstanceColor.rgb : aVertexColor;",
  "  vAlpha = aInstanceColor.a;",
  "}",
].join("\n");

export const FRAGMENT_SHADER = [
  "#version 300 es",
  "precision highp float;",
  "in vec3 vNormal;",
  "in vec3 vLinearColor;",
  "in float vAlpha;",
  "in vec4 vSunPosition;",
  "uniform int uShadowEnabled;",
  "uniform sampler2D uShadowMap;",
  "out vec4 outColor;",
  "vec3 encodeSRGB(vec3 light) {",
  "  vec3 lo = light * 12.92;",
  "  vec3 hi = 1.055 * pow(max(light, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;",
  "  return clamp(mix(hi, lo, lessThanEqual(light, vec3(0.0031308))), 0.0, 1.0);",
  "}",
  "float sunVisibility(vec3 normal, vec3 sun) {",
  "  if (uShadowEnabled == 0) return 1.0;",
  "  vec3 shadow = vSunPosition.xyz / max(vSunPosition.w, 0.00001);",
  "  shadow = shadow * 0.5 + 0.5;",
  "  if (shadow.x <= 0.0 || shadow.y <= 0.0 || shadow.x >= 1.0 || shadow.y >= 1.0",
  "      || shadow.z <= 0.0 || shadow.z >= 1.0) return 1.0;",
  "  float bias = max(0.00032, 0.0014 * (1.0 - max(dot(normal, sun), 0.0)));",
  "  vec2 texel = 1.7 / vec2(textureSize(uShadowMap, 0));",
  "  float visible = 0.0;",
  "  for (int x = -1; x <= 1; x++) {",
  "    for (int y = -1; y <= 1; y++) {",
  "      float depth = texture(uShadowMap, shadow.xy + vec2(float(x), float(y)) * texel).r;",
  "      visible += shadow.z - bias <= depth ? 1.0 : 0.0;",
  "    }",
  "  }",
  "  return mix(0.36, 1.0, visible / 9.0);",
  "}",
  "void main() {",
  "  vec3 normal = normalize(vNormal);",
  "  vec3 sun = normalize(vec3(-0.52, 0.82, 0.37));",
  "  float diffuse = max(dot(normal, sun), 0.0);",
  "  float shadow = sunVisibility(normal, sun);",
  "  // Cool hemispheric ambient keeps underside details legible; a warm",
  "  // directional key and weak opposing bounce separate the physical planes.",
  "  vec3 ambient = vec3(0.77, 0.87, 1.06) * (0.52 + 0.13 * max(normal.y, 0.0));",
  "  vec3 direct = vec3(1.20, 1.05, 0.85) * (0.78 * diffuse * shadow);",
  "  float bounce = max(dot(normal, normalize(vec3(0.65, 0.25, -0.72))), 0.0);",
  "  vec3 lit = vLinearColor * (ambient + direct + vec3(0.10, 0.09, 0.07) * bounce);",
  "  // Gentle highlight shoulder in linear light; no bloom, vignette or fog.",
  "  lit /= vec3(1.0) + 0.16 * lit;",
  "  // Gentle chroma recovery counters the muted miniature palette after",
  "  // HDR-style light accumulation without clipping bright material faces.",
  "  float luminance = dot(lit, vec3(0.2126, 0.7152, 0.0722));",
  "  lit = max(vec3(0.0), mix(vec3(luminance), lit, 1.20));",
  "  outColor = vec4(encodeSRGB(lit), vAlpha);",
  "}",
].join("\n");

function ensureMatrix(matrix: ArrayLike<number>, label: string): void {
  if (matrix.length !== 16) throw new RangeError(label + " must be a 16-float matrix");
  for (let i = 0; i < 16; i++) {
    if (!Number.isFinite(matrix[i])) throw new RangeError(label + " contains nonfinite values");
  }
}

export class InstancedRenderer {
  private readonly gpu: GpuResources;
  private readonly meshes = new Map<string, GpuMesh>();
  private readonly program: WebGLProgram;
  private readonly viewProjectionUniform: WebGLUniformLocation;
  private readonly sunMatrixUniform: WebGLUniformLocation;
  private readonly shadowEnabledUniform: WebGLUniformLocation;
  private readonly shadowMapUniform: WebGLUniformLocation;
  private readonly sunMatrix = createSunViewProjection();
  private shadow: SunShadowPass | null = null;
  private frustumCulling = false;
  private uploadedMeshBytes = 0;
  private readonly stream: WebGLBuffer;
  private capacity = INITIAL_INSTANCE_CAPACITY;
  private scratch = new Float32Array(INITIAL_INSTANCE_CAPACITY * FLOATS_PER_INSTANCE);
  private disposed = false;

  constructor(readonly gl: WebGL2RenderingContext) {
    this.gpu = new GpuResources(gl);
    try {
      this.program = this.gpu.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
      const location = gl.getUniformLocation(this.program, "uViewProjection");
      if (!location) throw new Error("Instanced shader is missing uViewProjection");
      this.viewProjectionUniform = location;
      const sunMatrix = gl.getUniformLocation(this.program, "uSunViewProjection");
      const shadowEnabled = gl.getUniformLocation(this.program, "uShadowEnabled");
      const shadowMap = gl.getUniformLocation(this.program, "uShadowMap");
      if (sunMatrix === null || shadowEnabled === null || shadowMap === null) {
        throw new Error("Diorama lighting uniforms were optimized out");
      }
      this.sunMatrixUniform = sunMatrix;
      this.shadowEnabledUniform = shadowEnabled;
      this.shadowMapUniform = shadowMap;
      this.stream = this.gpu.createBuffer(gl.ARRAY_BUFFER, this.scratch, gl.DYNAMIC_DRAW);
    } catch (error) {
      this.gpu.dispose();
      throw error;
    }
  }

  /** Optional quality tier: one cached directional shadow depth pass per frame. */
  enableSunShadows(): void {
    this.ensureActive();
    if (!this.shadow) this.shadow = new SunShadowPass(this.gl);
  }

  /** Opt in for scenes that benefit from precise mesh-AABB camera culling. */
  enableFrustumCulling(): void {
    this.ensureActive();
    this.frustumCulling = true;
  }

  get frustumCullingEnabled(): boolean { return this.frustumCulling; }
  get sunShadowsEnabled(): boolean { return this.shadow !== null; }
  get meshCount(): number { return this.meshes.size; }
  get estimatedGpuBytes(): number {
    // DEPTH_COMPONENT24 may be padded to 32 bits. This is an allocation
    // estimate, not actual driver VRAM use or a GPU timer query.
    return this.uploadedMeshBytes + this.scratch.byteLength
      + (this.shadow ? SHADOW_MAP_SIZE * SHADOW_MAP_SIZE * 4 : 0);
  }
  get resourceCounts() { return this.gpu.counts; }

  /** Register and upload static mesh geometry exactly once per key. */
  uploadMesh(id: string, geometry: Geometry): void {
    this.ensureActive();
    if (!id || this.meshes.has(id)) throw new Error("Invalid or duplicate mesh key: " + id);
    validateGeometry(geometry);
    const gl = this.gl;
    const paletteData = new Float32Array(geometry.materialIds.length * 3);
    for (let i = 0; i < geometry.materialIds.length; i++) {
      const color = vertexMaterialColor(geometry.materialIds[i]!);
      const start = i * 3;
      paletteData[start] = color?.[0] ?? -1; // -1 -> inherit instance material
      paletteData[start + 1] = color?.[1] ?? 0;
      paletteData[start + 2] = color?.[2] ?? 0;
    }
    try {
      const position = this.gpu.createBuffer(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
      const normal = this.gpu.createBuffer(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
      const materialColor = this.gpu.createBuffer(gl.ARRAY_BUFFER, paletteData, gl.STATIC_DRAW);
      const index = this.gpu.createBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      const vao = this.gpu.createVertexArray();
      gl.bindVertexArray(vao);
      try {
        const staticAttrib = (slot: number, buffer: WebGLBuffer, width: number) => {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.enableVertexAttribArray(slot);
          gl.vertexAttribPointer(slot, width, gl.FLOAT, false, 0, 0);
        };
        staticAttrib(0, position, 3);
        staticAttrib(1, normal, 3);
        staticAttrib(7, materialColor, 3);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.stream);
        const stride = FLOATS_PER_INSTANCE * Float32Array.BYTES_PER_ELEMENT;
        for (let column = 0; column < 4; column++) {
          const slot = column + 2;
          gl.enableVertexAttribArray(slot);
          gl.vertexAttribPointer(slot, 4, gl.FLOAT, false, stride, column * 16);
          gl.vertexAttribDivisor(slot, 1);
        }
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, stride, 16 * 4);
        gl.vertexAttribDivisor(6, 1);
        // GpuResources.createBuffer unbinds this target: rebind inside VAO.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      } finally {
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
      this.meshes.set(id, {
        vao,
        indexCount: geometry.indices.length,
        indexType: geometry.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
        bounds: geometry.bounds,
      });
      this.uploadedMeshBytes += geometry.positions.byteLength + geometry.normals.byteLength
        + paletteData.byteLength + geometry.indices.byteLength;
    } catch (error) {
      // Keep partially uploaded resources from surviving a failed registration.
      this.dispose();
      throw error;
    }
  }

  /** Render opaque groups then sorted, contiguous transparent groups. */
  render(camera: CameraMatrices, instances: readonly RenderInstance[]): RenderStats {
    this.ensureActive();
    ensureMatrix(camera.view, "View");
    ensureMatrix(camera.viewProjection, "View-projection");
    const gl = this.gl, start = performance.now();
    const opaque = new Map<string, Prepared[]>();
    const shadowOpaque = new Map<string, Prepared[]>();
    const transparent: Prepared[] = [];
    let culled = 0;
    const appendBatch = (batches: Map<string, Prepared[]>, entry: Prepared) => {
      const key = entry.meshId + "\u0000" + entry.material;
      let batch = batches.get(key);
      if (!batch) { batch = []; batches.set(key, batch); }
      batch.push(entry);
    };
    for (let i = 0; i < instances.length; i++) {
      const source = instances[i]!;
      ensureMatrix(source.model, "Model");
      const mesh = this.meshes.get(source.meshId);
      if (!mesh) throw new Error("Unknown mesh: " + source.meshId);
      const opacity = source.opacity ?? 1;
      if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
        throw new RangeError("Opacity must be in [0,1]");
      }
      if (opacity === 0) continue;
      const visible = !this.frustumCulling
        || aabbIntersectsFrustum(mesh.bounds, source.model, camera.viewProjection);
      const castsSunShadow = this.shadow !== null && opacity === 1
        && (!this.frustumCulling
          || aabbIntersectsFrustum(mesh.bounds, source.model, this.sunMatrix));
      if (!visible) culled++;
      if (!visible && !castsSunShadow) continue;
      const v = camera.view, m = source.model;
      const prepared: Prepared = {
        meshId: source.meshId, material: source.material, model: source.model,
        opacity, color: linearColor(source.material), sequence: i,
        // Eye-space Z: more negative is farther from the camera.
        viewZ: v[2]! * m[12]! + v[6]! * m[13]! + v[10]! * m[14]! + v[14]!,
      };
      if (opacity < 1) {
        if (visible) transparent.push(prepared);
      } else {
        // A caster may be outside the camera while still shadowing something
        // visible, so the sun pass must use an independent visibility test.
        if (visible) appendBatch(opaque, prepared);
        if (castsSunShadow) appendBatch(shadowOpaque, prepared);
      }
    }
    transparent.sort((a, b) => a.viewZ - b.viewZ || a.sequence - b.sequence);
    let drawCalls = 0, opaqueDrawCalls = 0, transparentDrawCalls = 0;
    let triangles = 0, rendered = 0;
    let shadowDrawCalls = 0, shadowInstances = 0, shadowTriangles = 0;
    try {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.frontFace(gl.CCW);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.clearColor(0.831, 0.859, 0.824, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(
        this.viewProjectionUniform, false, new Float32Array(Array.from(camera.viewProjection)),
      );
      gl.uniformMatrix4fv(this.sunMatrixUniform, false, this.sunMatrix);
      const drawBatch = (batch: readonly Prepared[], countForStats = true): void => {
        if (!batch.length) return;
        const mesh = this.meshes.get(batch[0]!.meshId)!;
        this.ensureCapacity(batch.length);
        for (let i = 0; i < batch.length; i++) {
          const item = batch[i]!, start = i * FLOATS_PER_INSTANCE;
          for (let j = 0; j < 16; j++) this.scratch[start + j] = item.model[j]!;
          this.scratch[start + 16] = item.color[0];
          this.scratch[start + 17] = item.color[1];
          this.scratch[start + 18] = item.color[2];
          this.scratch[start + 19] = item.opacity;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.stream);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0,
          this.scratch.subarray(0, batch.length * FLOATS_PER_INSTANCE));
        gl.bindVertexArray(mesh.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, mesh.indexCount, mesh.indexType, 0, batch.length);
        if (countForStats) {
          rendered += batch.length;
          drawCalls++;
          triangles += mesh.indexCount / 3 * batch.length;
        } else {
          shadowDrawCalls++;
          shadowInstances += batch.length;
          shadowTriangles += mesh.indexCount / 3 * batch.length;
        }
      };
      if (this.shadow) {
        try {
          this.shadow.begin();
          for (const batch of shadowOpaque.values()) drawBatch(batch, false);
        } finally {
          this.shadow.end();
        }
        // The shadow pass changes viewport/program; the primary color/depth
        // framebuffer was cleared above and still retains that state.
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.useProgram(this.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.shadow.depthTexture);
        gl.uniform1i(this.shadowMapUniform, 0);
        gl.uniform1i(this.shadowEnabledUniform, 1);
      } else {
        // Unset int uniforms default to zero on a fresh linked program.
        // Explicitly keep the fallback deterministic if lighting is toggled.
        // WebGL mocks from F1.04 intentionally need no texture methods.
        if (typeof gl.uniform1i === "function") gl.uniform1i(this.shadowEnabledUniform, 0);
      }
      for (const batch of opaque.values()) {
        drawBatch(batch);
        opaqueDrawCalls++;
      }
      if (transparent.length) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        let first = 0;
        for (let i = 1; i <= transparent.length; i++) {
          if (i < transparent.length
            && transparent[i]!.meshId === transparent[first]!.meshId
            && transparent[i]!.material === transparent[first]!.material) continue;
          drawBatch(transparent.slice(first, i));
          transparentDrawCalls++;
          first = i;
        }
      }
    } finally {
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      this.shadow?.end();
      if (this.shadow) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.useProgram(null);
    }
    return {
      submitted: instances.length, instances: rendered, culled, drawCalls,
      shadowDrawCalls, shadowInstances, shadowTriangles,
      opaqueDrawCalls, transparentDrawCalls, triangles,
      estimatedGpuBytes: this.estimatedGpuBytes,
      cpuMilliseconds: performance.now() - start, instanceCapacity: this.capacity,
    };
  }

  abandonOnContextLoss(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.meshes.clear();
    this.uploadedMeshBytes = 0;
    this.shadow?.abandonOnContextLoss();
    this.shadow = null;
    this.gpu.abandonOnContextLoss();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.meshes.clear();
    this.uploadedMeshBytes = 0;
    this.shadow?.dispose();
    this.shadow = null;
    this.gpu.dispose();
  }

  private ensureActive(): void {
    if (this.disposed || this.gl.isContextLost()) {
      throw new Error("Renderer inactive: rebuild after WebGL2 context restoration");
    }
  }

  private ensureCapacity(count: number): void {
    if (count <= this.capacity) return;
    while (this.capacity < count) this.capacity *= 2;
    this.scratch = new Float32Array(this.capacity * FLOATS_PER_INSTANCE);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stream);
    gl.bufferData(gl.ARRAY_BUFFER, this.scratch.byteLength, gl.DYNAMIC_DRAW);
  }
}
