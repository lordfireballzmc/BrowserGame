/**
 * F1.01 — WebGL2 shader diagnostics and explicit GPU resource ownership.
 *
 * Every resource belongs to a single WebGL context generation. reset()
 * releases live resources, abandonOnContextLoss() forgets invalid handles
 * without calling WebGL, and a new manager is created after restoration.
 */
export type GpuFailureStage = "vertex" | "fragment" | "link" | "allocation" | "lifecycle";

export class GpuFailure extends Error {
  constructor(readonly stage: GpuFailureStage, detail: string) {
    super("WebGL2 " + stage + ": " + detail);
    this.name = "GpuFailure";
  }
}

export function numberedShaderSource(source: string): string {
  return source.split("\n").map((line, index) => String(index + 1) + ": " + line).join("\n");
}

export interface ResourceCounts {
  readonly buffers: number;
  readonly vertexArrays: number;
  readonly textures: number;
  readonly framebuffers: number;
  readonly programs: number;
}

export class GpuResources {
  private readonly buffers = new Set<WebGLBuffer>();
  private readonly vertexArrays = new Set<WebGLVertexArrayObject>();
  private readonly textures = new Set<WebGLTexture>();
  private readonly framebuffers = new Set<WebGLFramebuffer>();
  private readonly programs = new Set<WebGLProgram>();
  private disposed = false;
  private lost = false;

  constructor(readonly gl: WebGL2RenderingContext) {}

  get counts(): ResourceCounts {
    return {
      buffers: this.buffers.size,
      vertexArrays: this.vertexArrays.size,
      textures: this.textures.size,
      framebuffers: this.framebuffers.size,
      programs: this.programs.size,
    };
  }

  private ensureAvailable(): void {
    if (this.disposed || this.lost) {
      throw new GpuFailure("lifecycle", "resources belong to an inactive WebGL context");
    }
    if (this.gl.isContextLost()) {
      this.abandonOnContextLoss();
      throw new GpuFailure("lifecycle", "graphics context lost; recreate resources after restoration");
    }
  }

  private compileShader(type: number, stage: "vertex" | "fragment", source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) throw new GpuFailure("allocation", "unable to create " + stage + " shader");
    try {
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new GpuFailure(stage,
          (gl.getShaderInfoLog(shader) || "unknown shader compiler error")
          + "\n" + numberedShaderSource(source));
      }
      return shader;
    } catch (error) {
      gl.deleteShader(shader);
      throw error;
    }
  }

  /** Compiles and links GLSL ES 3.00, cleaning temporary shaders on all paths. */
  createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    this.ensureAvailable();
    const gl = this.gl;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    try {
      vertex = this.compileShader(gl.VERTEX_SHADER, "vertex", vertexSource);
      fragment = this.compileShader(gl.FRAGMENT_SHADER, "fragment", fragmentSource);
      program = gl.createProgram();
      if (!program) throw new GpuFailure("allocation", "unable to create program");
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new GpuFailure("link", gl.getProgramInfoLog(program) || "unknown program linker error");
      }
      this.programs.add(program);
      return program;
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  /** Upload data and own the buffer; a thrown upload never leaks a GL handle. */
  createBuffer(
    target: number,
    data: Float32Array | Uint16Array | Uint32Array,
    usage: number,
  ): WebGLBuffer {
    this.ensureAvailable();
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) throw new GpuFailure("allocation", "unable to create buffer");
    try {
      gl.bindBuffer(target, buffer);
      gl.bufferData(target, data, usage);
      this.buffers.add(buffer);
      return buffer;
    } catch (error) {
      gl.deleteBuffer(buffer);
      throw error;
    } finally {
      gl.bindBuffer(target, null);
    }
  }

  createVertexArray(): WebGLVertexArrayObject {
    this.ensureAvailable();
    const vao = this.gl.createVertexArray();
    if (!vao) throw new GpuFailure("allocation", "unable to create vertex array");
    this.vertexArrays.add(vao);
    return vao;
  }

  createTexture(): WebGLTexture {
    this.ensureAvailable();
    const texture = this.gl.createTexture();
    if (!texture) throw new GpuFailure("allocation", "unable to create texture");
    this.textures.add(texture);
    return texture;
  }

  createFramebuffer(): WebGLFramebuffer {
    this.ensureAvailable();
    const framebuffer = this.gl.createFramebuffer();
    if (!framebuffer) throw new GpuFailure("allocation", "unable to create framebuffer");
    this.framebuffers.add(framebuffer);
    return framebuffer;
  }

  releaseBuffer(buffer: WebGLBuffer): void {
    if (!this.buffers.delete(buffer)) return;
    if (!this.lost && !this.disposed && !this.gl.isContextLost()) {
      this.gl.deleteBuffer(buffer);
    }
  }

  /** Deletes every tracked resource while usable; reset may be called repeatedly. */
  reset(): void {
    if (!this.lost && !this.disposed && !this.gl.isContextLost()) {
      const gl = this.gl;
      for (const vao of this.vertexArrays) gl.deleteVertexArray(vao);
      for (const framebuffer of this.framebuffers) gl.deleteFramebuffer(framebuffer);
      for (const texture of this.textures) gl.deleteTexture(texture);
      for (const buffer of this.buffers) gl.deleteBuffer(buffer);
      for (const program of this.programs) gl.deleteProgram(program);
    }
    this.clearOwnership();
  }

  /** A lost context already invalidated the GPU handles. Avoid GL calls on it. */
  abandonOnContextLoss(): void {
    if (this.lost) return;
    this.lost = true;
    this.clearOwnership();
  }

  dispose(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
  }

  private clearOwnership(): void {
    this.buffers.clear();
    this.vertexArrays.clear();
    this.textures.clear();
    this.framebuffers.clear();
    this.programs.clear();
  }
}

/** Real shader/link/buffer lifecycle smoke test, no game objects drawn. */
export function verifyRendererResources(resources: GpuResources): void {
  const gl = resources.gl;
  try {
    resources.createProgram(
      "#version 300 es\nprecision mediump float;\nvoid main() { gl_Position = vec4(0.0, 0.0, 0.0, 1.0); }",
      "#version 300 es\nprecision mediump float;\nout vec4 color;\nvoid main() { color = vec4(1.0); }",
    );
    resources.createBuffer(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0]), gl.STATIC_DRAW);
    resources.createVertexArray();
  } finally {
    resources.reset();
  }
}
