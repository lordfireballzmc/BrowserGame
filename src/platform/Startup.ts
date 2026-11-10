/**
 * F0.05 startup state and WebGL2 capability probe.
 * Pure state transitions stay testable in Node without a DOM or GPU.
 */
export type StartupView = "splash" | "diagnostic" | "fatal";
export type GraphicsStatus = "checking" | "ready" | "unavailable" | "lost";

export interface StartupState {
  readonly view: StartupView;
  readonly graphics: GraphicsStatus;
  readonly detail: string;
}

export type StartupEvent =
  | { readonly type: "PROBE_START" }
  | { readonly type: "PROBE_READY"; readonly version: string }
  | { readonly type: "PROBE_FAILED"; readonly reason: string }
  | { readonly type: "CONTEXT_LOST" }
  | { readonly type: "SHOW_DIAGNOSTIC" }
  | { readonly type: "SHOW_SPLASH" };

export const INITIAL_STARTUP_STATE: StartupState = {
  view: "splash",
  graphics: "checking",
  detail: "Checking whether this browser supports WebGL2.",
};

export function transitionStartup(state: StartupState, event: StartupEvent): StartupState {
  switch (event.type) {
    case "PROBE_START":
      return { view: "splash", graphics: "checking", detail: "Checking WebGL2 support." };
    case "PROBE_READY":
      return { view: "splash", graphics: "ready", detail: `WebGL2 ready — ${event.version}` };
    case "PROBE_FAILED":
      return { view: "fatal", graphics: "unavailable", detail: event.reason };
    case "CONTEXT_LOST":
      return {
        view: "fatal",
        graphics: "lost",
        detail: "The graphics context was lost. Restore it or retry graphics detection.",
      };
    case "SHOW_DIAGNOSTIC":
      return state.graphics === "ready" ? { ...state, view: "diagnostic" } : state;
    case "SHOW_SPLASH":
      return state.graphics === "ready" ? { ...state, view: "splash" } : state;
  }
}

/** Smaller contract than HTMLCanvasElement for headless tests. */
export interface WebGL2Provider {
  getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null;
}

export type WebGL2Probe =
  | { readonly ok: true; readonly gl: WebGL2RenderingContext; readonly version: string }
  | { readonly ok: false; readonly reason: string };

export function probeWebGL2(canvas: WebGL2Provider): WebGL2Probe {
  try {
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      depth: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      return {
        ok: false,
        reason: "WebGL2 is unavailable. Enable hardware acceleration or try a browser with WebGL2 support.",
      };
    }
    if (gl.isContextLost()) {
      return { ok: false, reason: "The WebGL2 graphics context is currently lost." };
    }
    return { ok: true, gl, version: String(gl.getParameter(gl.VERSION) ?? "unknown version") };
  } catch {
    return {
      ok: false,
      reason: "The browser could not initialize WebGL2. Check browser graphics settings, then retry.",
    };
  }
}

/** Paints a deliberately plain GPU diagnostic, never presented as game art. */
export function paintGraphicsDiagnostic(
  canvas: Pick<HTMLCanvasElement, "width" | "height" | "getBoundingClientRect">,
  gl: WebGL2RenderingContext,
  devicePixelRatio: number,
): void {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) return;
  const scale = Number.isFinite(devicePixelRatio)
    ? Math.max(1, Math.min(2, devicePixelRatio))
    : 1;
  canvas.width = Math.max(1, Math.min(4096, Math.round(bounds.width * scale)));
  canvas.height = Math.max(1, Math.min(4096, Math.round(bounds.height * scale)));
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.831, 0.859, 0.824, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
