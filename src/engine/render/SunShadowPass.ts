/**
 * F2.06 — stable afternoon sun shadow map for the fixed-angle diorama.
 * No third-party renderer and no per-frame GPU resource allocations.
 *
 * The sun bounds deliberately cover the full 72x48m Fenwall island, keep,
 * actors and bridges at once. Opaque mesh instances reuse the main renderer's
 * VAOs/instance stream. The depth texture is owned and released on disposal.
 */
import { mat4 } from "gl-matrix";
import { GpuResources } from "./GpuResources";

export const SHADOW_MAP_SIZE = 1024;
export const SUN_VECTOR: readonly [number, number, number] = [-0.52, 0.82, 0.37];

export function createSunViewProjection(): mat4 {
  const eye: [number, number, number] = [
    SUN_VECTOR[0] * 142, SUN_VECTOR[1] * 142, SUN_VECTOR[2] * 142,
  ];
  const view = mat4.lookAt(mat4.create(), eye, [0, 0, 0], [0, 1, 0]);
  const projection = mat4.ortho(mat4.create(), -70, 70, -70, 70, 1, 290);
  return mat4.multiply(mat4.create(), projection, view);
}

const DEPTH_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=2) in vec4 aModel0;
layout(location=3) in vec4 aModel1;
layout(location=4) in vec4 aModel2;
layout(location=5) in vec4 aModel3;
uniform mat4 uSunViewProjection;
void main() {
  mat4 model = mat4(aModel0,aModel1,aModel2,aModel3);
  gl_Position = uSunViewProjection * model * vec4(aPosition,1.0);
}`;
const DEPTH_FRAGMENT = `#version 300 es
precision highp float;
void main() { }`;

export class SunShadowPass {
  private readonly resources: GpuResources;
  private readonly framebuffer: WebGLFramebuffer;
  readonly depthTexture: WebGLTexture;
  readonly matrix = createSunViewProjection();
  private readonly program: WebGLProgram;
  private readonly matrixUniform: WebGLUniformLocation;
  private drawing = false;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.resources = new GpuResources(gl);
    try {
      this.program = this.resources.createProgram(DEPTH_VERTEX, DEPTH_FRAGMENT);
      const location = gl.getUniformLocation(this.program, "uSunViewProjection");
      if (location === null) throw new Error("Sun depth shader lost view-projection uniform");
      this.matrixUniform = location;
      this.depthTexture = this.resources.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24,
        SHADOW_MAP_SIZE, SHADOW_MAP_SIZE, 0,
        gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);

      this.framebuffer = this.resources.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D, this.depthTexture, 0);
      gl.drawBuffers([gl.NONE]);
      gl.readBuffer(gl.NONE);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error("Sun shadow framebuffer incomplete: " + status);
      }
    } catch (error) {
      this.resources.dispose();
      throw error;
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  begin(): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    gl.colorMask(false, false, false, false);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.5, 2.5);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.matrixUniform, false, this.matrix);
    this.drawing = true;
  }

  end(): void {
    if (!this.drawing) return;
    const gl = this.gl;
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.drawing = false;
  }

  dispose(): void {
    this.end();
    this.resources.dispose();
  }

  abandonOnContextLoss(): void {
    this.drawing = false;
    this.resources.abandonOnContextLoss();
  }
}
