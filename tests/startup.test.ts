import { describe, expect, it, vi } from "vitest";
import {
  INITIAL_STARTUP_STATE,
  paintGraphicsDiagnostic,
  probeWebGL2,
  transitionStartup,
  type WebGL2Provider,
} from "../src/platform/Startup";

function graphicsStub() {
  const gl = {
    VERSION: 7938,
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
    isContextLost: vi.fn(() => false),
    getParameter: vi.fn(() => "WebGL 2.0 Mock"),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
  };
  return { gl, asWebGL: gl as unknown as WebGL2RenderingContext };
}

describe("startup state transitions", () => {
  it("starts on a non-playable splash while checking graphics", () => {
    expect(INITIAL_STARTUP_STATE).toEqual({
      view: "splash",
      graphics: "checking",
      detail: expect.any(String),
    });
  });

  it("allows diagnostics only when WebGL2 is ready", () => {
    expect(transitionStartup(INITIAL_STARTUP_STATE, { type: "SHOW_DIAGNOSTIC" }))
      .toBe(INITIAL_STARTUP_STATE);

    const ready = transitionStartup(INITIAL_STARTUP_STATE, {
      type: "PROBE_READY", version: "WebGL 2.0",
    });
    expect(ready.graphics).toBe("ready");
    expect(ready.view).toBe("splash");
    const diagnostic = transitionStartup(ready, { type: "SHOW_DIAGNOSTIC" });
    expect(diagnostic.view).toBe("diagnostic");
    expect(transitionStartup(diagnostic, { type: "SHOW_SPLASH" }).view).toBe("splash");
  });

  it("shows explicit fatal states after a failed probe or context loss", () => {
    const failed = transitionStartup(INITIAL_STARTUP_STATE, {
      type: "PROBE_FAILED", reason: "WebGL2 disabled",
    });
    expect(failed).toEqual({
      view: "fatal", graphics: "unavailable", detail: "WebGL2 disabled",
    });
    expect(transitionStartup(failed, { type: "SHOW_DIAGNOSTIC" }).view).toBe("fatal");
    const lost = transitionStartup(INITIAL_STARTUP_STATE, { type: "CONTEXT_LOST" });
    expect(lost.view).toBe("fatal");
    expect(lost.graphics).toBe("lost");
    expect(transitionStartup(lost, { type: "PROBE_START" }).graphics).toBe("checking");
    expect(transitionStartup(lost, { type: "PROBE_READY", version: "restored" }).view)
      .toBe("splash");
  });
});

describe("WebGL2 probe and render diagnostics", () => {
  it("requests WebGL2 and reports an actual context version", () => {
    const { gl, asWebGL } = graphicsStub();
    const getContext = vi.fn(() => asWebGL);
    const canvas: WebGL2Provider = { getContext };
    const result = probeWebGL2(canvas);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.gl).toBe(asWebGL);
      expect(result.version).toBe("WebGL 2.0 Mock");
    }
    expect(getContext).toHaveBeenCalledWith("webgl2", {
      antialias: true, alpha: false, depth: true, powerPreference: "high-performance",
    });
    expect(gl.getParameter).toHaveBeenCalledWith(gl.VERSION);
  });

  it("returns a recoverable error when no context exists", () => {
    const result = probeWebGL2({ getContext: () => null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("WebGL2 is unavailable");
  });

  it("handles blocked contexts, lost contexts and driver exceptions without throwing", () => {
    expect(probeWebGL2({
      getContext: () => { throw new Error("graphics blocked"); },
    }).ok).toBe(false);
    const { gl, asWebGL } = graphicsStub();
    gl.isContextLost.mockReturnValue(true);
    const lost = probeWebGL2({ getContext: () => asWebGL });
    expect(lost.ok).toBe(false);
    if (!lost.ok) expect(lost.reason).toContain("lost");
  });

  it("resizes the diagnostic according to DPR and clears the WebGL backbuffer", () => {
    const { gl, asWebGL } = graphicsStub();
    const canvas = {
      width: 0, height: 0,
      getBoundingClientRect: () => ({ width: 400, height: 250 } as DOMRect),
    };
    paintGraphicsDiagnostic(canvas, asWebGL, 2.5);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(500);
    expect(gl.viewport).toHaveBeenCalledWith(0, 0, 800, 500);
    expect(gl.clearColor).toHaveBeenCalledWith(0.831, 0.859, 0.824, 1);
    expect(gl.clear).toHaveBeenCalledWith(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  });

  it("skips invisible canvases rather than allocating a large GPU buffer", () => {
    const { gl, asWebGL } = graphicsStub();
    const canvas = {
      width: 100, height: 100,
      getBoundingClientRect: () => ({ width: 0, height: 0 } as DOMRect),
    };
    paintGraphicsDiagnostic(canvas, asWebGL, 2);
    expect(gl.viewport).not.toHaveBeenCalled();
    expect(canvas.width).toBe(100);
  });
});
