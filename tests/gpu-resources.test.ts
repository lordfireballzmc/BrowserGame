import { describe, expect, it, vi } from "vitest";
import { GpuFailure, GpuResources, numberedShaderSource, verifyRendererResources } from "../src/engine/render/GpuResources";

function fakeGL() {
  let nextId = 0;
  const makeHandle = () => ({ id: ++nextId });

  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    isContextLost: vi.fn(() => false),
    createShader: vi.fn(makeHandle),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => "bad syntax near line 2"),
    deleteShader: vi.fn(),
    createProgram: vi.fn(makeHandle),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => "varying mismatch"),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(makeHandle),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn(),
    createVertexArray: vi.fn(makeHandle),
    deleteVertexArray: vi.fn(),
    createTexture: vi.fn(makeHandle),
    deleteTexture: vi.fn(),
    createFramebuffer: vi.fn(makeHandle),
    deleteFramebuffer: vi.fn(),
  };
  return { gl, context: gl as unknown as WebGL2RenderingContext };
}

function allZero(resources: GpuResources): void {
  expect(resources.counts).toEqual({
    buffers: 0, vertexArrays: 0, textures: 0, framebuffers: 0, programs: 0,
  });
}

describe("F1.01 WebGL2 shader errors", () => {
  it("includes numbered source lines in a failed compiler diagnostic", () => {
    const { gl, context } = fakeGL();
    gl.getShaderParameter.mockReturnValue(false);
    const resources = new GpuResources(context);
    expect(() => resources.createProgram("bad\nvertex", "fragment"))
      .toThrow(/WebGL2 vertex: bad syntax near line 2[\s\S]*1: bad[\s\S]*2: vertex/);
    expect(gl.deleteShader).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).not.toHaveBeenCalled();
    allZero(resources);
    expect(numberedShaderSource("a\nb")).toBe("1: a\n2: b");
  });

  it("deletes both compiled shaders after a successful link", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    const program = resources.createProgram("vertex", "fragment");
    expect(program).toBeTruthy();
    expect(gl.attachShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteProgram).not.toHaveBeenCalled();
    expect(resources.counts.programs).toBe(1);
    resources.reset();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    allZero(resources);
  });

  it("cleans an earlier vertex shader if fragment compilation fails", () => {
    const { gl, context } = fakeGL();
    gl.getShaderParameter.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const resources = new GpuResources(context);
    expect(() => resources.createProgram("vertex", "fragment")).toThrow(GpuFailure);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    expect(gl.deleteProgram).not.toHaveBeenCalled();
    allZero(resources);
  });

  it("deletes linked program and shaders on a link failure", () => {
    const { gl, context } = fakeGL();
    gl.getProgramParameter.mockReturnValue(false);
    const resources = new GpuResources(context);
    expect(() => resources.createProgram("vertex", "fragment"))
      .toThrow("WebGL2 link: varying mismatch");
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    allZero(resources);
  });

  it("fails explicitly when the GPU refuses to allocate a shader or program", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    gl.createShader.mockReturnValueOnce(null as never);
    expect(() => resources.createProgram("vertex", "fragment")).toThrow("unable to create vertex shader");
    gl.createProgram.mockReturnValueOnce(null as never);
    expect(() => resources.createProgram("vertex", "fragment")).toThrow("unable to create program");
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    allZero(resources);
  });
});

describe("F1.01 GPU ownership and recovery", () => {
  it("tracks all GPU objects and releases each exactly once on reset", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    const first = resources.createBuffer(gl.ARRAY_BUFFER, new Float32Array([1, 2]), gl.STATIC_DRAW);
    resources.createBuffer(gl.ARRAY_BUFFER, new Uint16Array([0, 1]), gl.STATIC_DRAW);
    resources.createVertexArray();
    resources.createTexture();
    resources.createFramebuffer();
    resources.createProgram("vertex", "fragment");
    expect(resources.counts).toEqual({
      buffers: 2, vertexArrays: 1, textures: 1, framebuffers: 1, programs: 1,
    });
    resources.releaseBuffer(first);
    resources.releaseBuffer(first);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    resources.reset();
    resources.reset();
    allZero(resources);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(2);
    expect(gl.deleteVertexArray).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.bindBuffer).toHaveBeenLastCalledWith(gl.ARRAY_BUFFER, null);
  });

  it("deletes the untracked buffer if upload throws", () => {
    const { gl, context } = fakeGL();
    gl.bufferData.mockImplementationOnce(() => { throw new Error("bad upload"); });
    const resources = new GpuResources(context);
    expect(() => resources.createBuffer(gl.ARRAY_BUFFER, new Float32Array(3), gl.STATIC_DRAW))
      .toThrow("bad upload");
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    allZero(resources);
  });

  it("does not call WebGL deletion functions on a lost context", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    resources.createBuffer(gl.ARRAY_BUFFER, new Float32Array(3), gl.STATIC_DRAW);
    resources.createVertexArray();
    resources.createProgram("vertex", "fragment");
    const shaderDeletes = gl.deleteShader.mock.calls.length;
    resources.abandonOnContextLoss();
    resources.dispose();
    allZero(resources);
    expect(gl.deleteBuffer).not.toHaveBeenCalled();
    expect(gl.deleteVertexArray).not.toHaveBeenCalled();
    expect(gl.deleteProgram).not.toHaveBeenCalled();
    expect(gl.deleteShader).toHaveBeenCalledTimes(shaderDeletes);
    expect(() => resources.createVertexArray()).toThrow(/inactive WebGL context/);
  });

  it("detects an unexpected lost context before new allocations", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    gl.isContextLost.mockReturnValue(true);
    expect(() => resources.createVertexArray()).toThrow(/graphics context lost/);
    allZero(resources);
    expect(gl.createVertexArray).not.toHaveBeenCalled();
  });

  it("uses new context owners on restoration, without stale handles", () => {
    const lost = fakeGL();
    const owner = new GpuResources(lost.context);
    owner.createBuffer(lost.gl.ARRAY_BUFFER, new Float32Array(3), lost.gl.STATIC_DRAW);
    owner.abandonOnContextLoss();
    const restored = fakeGL();
    const newOwner = new GpuResources(restored.context);
    newOwner.createBuffer(restored.gl.ARRAY_BUFFER, new Float32Array(3), restored.gl.STATIC_DRAW);
    newOwner.reset();
    expect(restored.gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(lost.gl.deleteBuffer).not.toHaveBeenCalled();
    allZero(owner);
    allZero(newOwner);
  });

  it("verifies a real shader/buffer/VAO creation cycle with zero retained resources", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    verifyRendererResources(resources);
    allZero(resources);
    expect(gl.compileShader).toHaveBeenCalledTimes(2);
    expect(gl.linkProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteVertexArray).toHaveBeenCalledTimes(1);
  });

  it("cleans earlier program objects when a smoke test later fails", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    gl.bufferData.mockImplementationOnce(() => { throw new Error("driver failure"); });
    expect(() => verifyRendererResources(resources)).toThrow("driver failure");
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    allZero(resources);
  });

  it("makes disposal idempotent and refuses allocations after disposal", () => {
    const { gl, context } = fakeGL();
    const resources = new GpuResources(context);
    resources.createVertexArray();
    resources.dispose();
    resources.dispose();
    expect(gl.deleteVertexArray).toHaveBeenCalledTimes(1);
    expect(() => resources.createTexture()).toThrow(/inactive WebGL context/);
  });
});
