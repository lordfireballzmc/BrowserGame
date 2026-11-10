import { describe, expect, it, vi } from "vitest";
import { bevelBox } from "../src/art/mesh/Primitives";
import { InstancedRenderer, type RenderInstance } from "../src/engine/render/InstancedRenderer";
import { MATERIAL_TOKENS, linearColor, srgbChannelToLinear, vertexMaterialColor } from "../src/engine/render/Palette";

function fixture() {
  let serial = 0;
  const handle = () => ({ id: ++serial });
  const uploads: number[][] = [];
  const gl = {
    ARRAY_BUFFER: 34962, ELEMENT_ARRAY_BUFFER: 34963, STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048, FLOAT: 5126, UNSIGNED_SHORT: 5123, UNSIGNED_INT: 5125,
    TRIANGLES: 4, VERTEX_SHADER: 35633, FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713, LINK_STATUS: 35714, DEPTH_TEST: 2929,
    LEQUAL: 515, CULL_FACE: 2884, BACK: 1029, CCW: 2305,
    BLEND: 3042, SRC_ALPHA: 770, ONE_MINUS_SRC_ALPHA: 771,
    COLOR_BUFFER_BIT: 16384, DEPTH_BUFFER_BIT: 256,
    drawingBufferWidth: 640, drawingBufferHeight: 480,
    isContextLost: vi.fn(() => false),
    createShader: vi.fn(handle), shaderSource: vi.fn(), compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true), getShaderInfoLog: vi.fn(),
    deleteShader: vi.fn(), createProgram: vi.fn(handle), attachShader: vi.fn(),
    linkProgram: vi.fn(), getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(), deleteProgram: vi.fn(), useProgram: vi.fn(),
    getUniformLocation: vi.fn(handle), uniformMatrix4fv: vi.fn(),
    createBuffer: vi.fn(handle), bindBuffer: vi.fn(), bufferData: vi.fn(),
    bufferSubData: vi.fn((_target: number, _offset: number, data: Float32Array) =>
      uploads.push(Array.from(data))),
    deleteBuffer: vi.fn(), createVertexArray: vi.fn(handle),
    bindVertexArray: vi.fn(), deleteVertexArray: vi.fn(),
    createTexture: vi.fn(handle), deleteTexture: vi.fn(),
    createFramebuffer: vi.fn(handle), deleteFramebuffer: vi.fn(),
    enableVertexAttribArray: vi.fn(), vertexAttribPointer: vi.fn(),
    vertexAttribDivisor: vi.fn(), viewport: vi.fn(), enable: vi.fn(),
    disable: vi.fn(), depthFunc: vi.fn(), cullFace: vi.fn(),
    frontFace: vi.fn(), depthMask: vi.fn(), clearColor: vi.fn(),
    clear: vi.fn(), blendFunc: vi.fn(), drawElementsInstanced: vi.fn(),
  };
  return { gl, uploads, context: gl as unknown as WebGL2RenderingContext };
}

const identity = () => new Float32Array([
  1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1,
]);
const translate = (z: number) => new Float32Array([
  1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,z,1,
]);
const camera = { view: identity(), viewProjection: identity() };
const instance = (meshId = "box", z = 0, opacity = 1): RenderInstance => ({
  meshId, model: translate(z), material: "stone.base", opacity,
});

describe("F1.04 palette and gamma", () => {
  it("matches canonical art token order and exact authored hex colors", () => {
    expect(MATERIAL_TOKENS).toHaveLength(21);
    expect(linearColor("enemy.red")[0]).toBeCloseTo(srgbChannelToLinear(170 / 255), 9);
    expect(linearColor("grass.primary")[1]).toBeCloseTo(srgbChannelToLinear(151 / 255), 9);
    expect(srgbChannelToLinear(0)).toBe(0);
    expect(srgbChannelToLinear(1)).toBe(1);
    expect(() => srgbChannelToLinear(-0.1)).toThrow(RangeError);
    expect(() => srgbChannelToLinear(NaN)).toThrow(RangeError);
  });

  it("reserves slot zero for instance color and rejects undefined palette slots", () => {
    expect(vertexMaterialColor(0)).toBeNull();
    expect(vertexMaterialColor(1)).toEqual(linearColor("grass.primary"));
    expect(vertexMaterialColor(21)).toEqual(linearColor("water"));
    expect(() => vertexMaterialColor(22)).toThrow(RangeError);
  });
});

describe("F1.04 real draw batching contract (mock WebGL)", () => {
  it("issues ONE draw call for 500 opaque instances and reuses its stream capacity", () => {
    const { gl, context } = fixture();
    const renderer = new InstancedRenderer(context);
    renderer.uploadMesh("box", bevelBox(1, 1, 1, 0.12));
    const batch = Array.from({length: 500}, (_, i) => instance("box", -i * 0.01));
    const first = renderer.render(camera, batch);
    const reallocations = gl.bufferData.mock.calls.length;
    const second = renderer.render(camera, batch);
    expect(first.instances).toBe(500);
    expect(first.drawCalls).toBe(1);
    expect(first.opaqueDrawCalls).toBe(1);
    expect(first.transparentDrawCalls).toBe(0);
    expect(first.instanceCapacity).toBe(512);
    expect(second.instanceCapacity).toBe(512);
    expect(gl.bufferData).toHaveBeenCalledTimes(reallocations);
    expect(gl.drawElementsInstanced).toHaveBeenCalledTimes(2);
    expect(gl.drawElementsInstanced).toHaveBeenCalledWith(
      gl.TRIANGLES, expect.any(Number), gl.UNSIGNED_SHORT, 0, 500,
    );
    expect(gl.vertexAttribDivisor).toHaveBeenCalledTimes(5);
    expect(renderer.meshCount).toBe(1);
    renderer.dispose();
    expect(renderer.resourceCounts).toEqual({
      buffers: 0, vertexArrays: 0, textures: 0, framebuffers: 0, programs: 0,
    });
    expect(() => renderer.render(camera, batch)).toThrow(/inactive/);
  });

  it("sorts transparent objects far-to-near and restores depth-write state", () => {
    const { gl, context, uploads } = fixture();
    const renderer = new InstancedRenderer(context);
    renderer.uploadMesh("box", bevelBox(1, 1, 1));
    renderer.uploadMesh("other", bevelBox(1, 1, 1));
    const stats = renderer.render(camera, [
      instance("box", -1, 0.5), // nearest transparent, submitted first
      instance("box", 0, 1),
      instance("other", -9, 0.35), // farthest transparent
      instance("box", -3, 0.25), // middle transparent
    ]);
    expect(stats.opaqueDrawCalls).toBe(1);
    // The two adjacent 'box' transparent instances coalesce without breaking depth order.
    expect(stats.transparentDrawCalls).toBe(2);
    expect(stats.drawCalls).toBe(3);
    expect(uploads.map(bytes => bytes[14])).toEqual([0, -9, -3]);
    expect(uploads[2]?.[34]).toBe(-1); // second instance in same 20-float run
    expect(gl.depthMask).toHaveBeenLastCalledWith(true);
    expect(gl.disable).toHaveBeenLastCalledWith(gl.BLEND);
    expect(gl.blendFunc).toHaveBeenCalledWith(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    renderer.dispose();
  });

  it("skips alpha zero without unnecessary draws and groups same mesh/material", () => {
    const { gl, context } = fixture();
    const renderer = new InstancedRenderer(context);
    renderer.uploadMesh("box", bevelBox(1, 1, 1));
    const stats = renderer.render(camera, [
      instance("box", 0, 0),
      instance("box", 0, 1),
      instance("box", -1, 1),
      instance("box", -2, 1),
    ]);
    expect(stats.submitted).toBe(4);
    expect(stats.instances).toBe(3);
    expect(stats.drawCalls).toBe(1);
    expect(gl.drawElementsInstanced).toHaveBeenCalledWith(
      gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, 3,
    );
    renderer.dispose();
  });

  it("opt-in frustum culls an offscreen instance without changing the one-draw batching rule", () => {
    const { context, gl } = fixture();
    const renderer = new InstancedRenderer(context);
    renderer.uploadMesh("box", bevelBox(1, 1, 1, 0.10));
    const objects = [
      { meshId:"box", material:"stone.base", model:translate(0) },
      { meshId:"box", material:"stone.base", model:translate(-3) },
      { meshId:"box", material:"stone.base", model:translate(-1.2) },
    ] as const;
    const before = renderer.render(camera,objects);
    expect(before.instances).toBe(3);
    expect(before.culled).toBe(0);
    renderer.enableFrustumCulling();
    const after = renderer.render(camera,objects);
    expect(after.submitted).toBe(3);
    expect(after.instances).toBe(2); // z=-1.2 touches the near clip boundary
    expect(after.culled).toBe(1);
    expect(after.drawCalls).toBe(1);
    expect(after.shadowDrawCalls).toBe(0);
    expect(after.estimatedGpuBytes).toBeGreaterThan(0);
    expect(gl.drawElementsInstanced).toHaveBeenLastCalledWith(
      gl.TRIANGLES,expect.any(Number),gl.UNSIGNED_SHORT,0,2,
    );
    renderer.dispose();
    expect(renderer.meshCount).toBe(0);
  });

  it("rejects unknown meshes, duplicate uploads and malformed matrix inputs", () => {
    const { context } = fixture();
    const renderer = new InstancedRenderer(context);
    renderer.uploadMesh("box", bevelBox(1, 1, 1));
    expect(() => renderer.uploadMesh("box", bevelBox(1, 1, 1))).toThrow(/duplicate/);
    expect(() => renderer.render(camera, [instance("missing")])).toThrow(/Unknown mesh/);
    expect(() => renderer.render(camera, [{
      ...instance(), opacity: 1.4,
    }])).toThrow(RangeError);
    expect(() => renderer.render(camera, [{
      ...instance(), model: new Float32Array([1, 0]),
    }])).toThrow(RangeError);
    renderer.dispose();
  });
});
