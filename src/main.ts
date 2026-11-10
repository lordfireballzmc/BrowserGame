import "./style.css";
import { createArtGallery, type ArtGallery } from "./art/models/Showcase";
import { OrthoCamera } from "./engine/Camera";
import {
  computeCanvasResolution, resizeCanvas, RenderMetricWindow,
  type ResolutionPreset,
} from "./engine/render/CanvasRuntime";
import { InstancedRenderer } from "./engine/render/InstancedRenderer";
import { GpuResources, verifyRendererResources } from "./engine/render/GpuResources";
import {
  INITIAL_STARTUP_STATE,
  probeWebGL2,
  transitionStartup,
  type StartupEvent,
  type StartupState,
} from "./platform/Startup";

function requireAppRoot(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#app");
  if (!element) throw new Error("App element #app is missing");
  return element;
}
const root = requireAppRoot();

// F0.05 is an honest engineering splash, NOT an interactive game or asset preview.
root.innerHTML = `
  <main class="shell" aria-label="Bastionfall engineering preview">
    <header class="masthead">
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>BASTIONFALL</span>
      <span class="build-label">ENGINEERING BUILD · F1.06</span>
    </header>

    <section class="splash panel" id="splash" aria-labelledby="splash-title">
      <p class="eyebrow">FENWALL CROSSING / FRONTIER DEFENSE</p>
      <h1 id="splash-title">Hold the line.<br />Build the frontier.</h1>
      <p class="lead">
        A hero-action tower-defense game built on an original WebGL2 engine.
        The engine foundations are being assembled. Gameplay is not available yet.
      </p>
      <div class="actions">
        <button type="button" id="show-diagnostic" disabled>Inspect WebGL2 diagnostic</button>
        <button type="button" class="secondary" disabled aria-label="Play unavailable during engineering preview">
          Play unavailable
        </button>
      </div>
      <p class="preview-note">The diagnostic checks graphics capability; it is not a playable level.</p>
    </section>

    <section class="diagnostic-screen panel" id="diagnostic-screen" aria-labelledby="diagnostic-title" hidden>
      <div class="section-header">
        <div>
          <p class="eyebrow">GRAPHICS DIAGNOSTIC · NOT GAMEPLAY</p>
          <h1 id="diagnostic-title">WebGL2 check</h1>
        </div>
        <button type="button" class="secondary" id="back-to-splash">Back to splash</button>
      </div>
      <div class="diagnostic-controls">
        <label for="resolution-preset">Rendering resolution</label>
        <select id="resolution-preset" aria-label="Rendering resolution">
          <option value="economy">Economy · 75%</option>
          <option value="balanced" selected>Balanced · 100%</option>
          <option value="sharp">Sharp · 125%</option>
        </select>
      </div>
      <div class="viewport">
        <canvas id="game" aria-label="WebGL2 gallery: warden, scrapper, shieldbearer and frontier keep; not gameplay"></canvas>
        <div class="render-error" id="render-error" role="alert" hidden>
          <strong>Rendering interrupted</strong>
          <p id="render-error-detail">The renderer encountered an error.</p>
          <button type="button" id="retry-renderer">Retry renderer</button>
        </div>
      </div>
      <output id="canvas-details" class="diagnostic-output" aria-live="off">Waiting for canvas size...</output>
      <output id="render-metrics" class="diagnostic-output" aria-live="off">Waiting for first frame...</output>
      <div class="archetype-legend" aria-label="Authored model showcase">
        <span><b>WARDEN</b> · golden mantle / blue hood</span>
        <span><b>SCRAPPER</b> · wedge hood / spear</span>
        <span><b>SHIELDBEARER</b> · broad dark shield</span>
        <span><b>FRONTIER KEEP</b> · gabled roof / stone gate</span>
      </div>
      <p class="preview-note">Four original procedurally assembled archetypes in a neutral <strong>art-review gallery</strong>. No terrain, combat, collision, animation or playable game exists yet. Frame intervals and CPU submission are <strong>not GPU timings</strong>.</p>
    </section>

    <section class="fatal-screen panel" id="fatal-screen" aria-labelledby="fatal-title" hidden>
      <p class="eyebrow">GRAPHICS UNAVAILABLE</p>
      <h1 id="fatal-title">The renderer could not start.</h1>
      <p class="lead">
        This browser could not provide a usable WebGL2 context.
        Check hardware acceleration and browser graphics settings, or try another browser.
      </p>
      <button type="button" id="retry-webgl2">Retry graphics detection</button>
      <p class="preview-note">The application remains usable for diagnostics; no simulation is started.</p>
    </section>

    <div id="startup-status" class="startup-status" role="status" aria-live="polite">
      Checking WebGL2 support.
    </div>
    <footer class="footer">
      <span>Original game · Original procedural art</span>
      <span>Custom WebGL2 / TypeScript</span>
      <span>Development milestone F1.06</span>
    </footer>
  </main>
`;

function requiredNode<T extends Element>(parent: ParentNode, selector: string): T {
  const found = parent.querySelector<T>(selector);
  if (!found) throw new Error(`Required startup element missing: ${selector}`);
  return found;
}
const splash = requiredNode<HTMLElement>(root, "#splash");
const diagnostic = requiredNode<HTMLElement>(root, "#diagnostic-screen");
const fatal = requiredNode<HTMLElement>(root, "#fatal-screen");
const status = requiredNode<HTMLElement>(root, "#startup-status");
const inspectButton = requiredNode<HTMLButtonElement>(root, "#show-diagnostic");
const canvas = requiredNode<HTMLCanvasElement>(root, "#game");
const quality = requiredNode<HTMLSelectElement>(root, "#resolution-preset");
const details = requiredNode<HTMLOutputElement>(root, "#canvas-details");
const metricsDisplay = requiredNode<HTMLOutputElement>(root, "#render-metrics");
const errorOverlay = requiredNode<HTMLElement>(root, "#render-error");
const errorDetail = requiredNode<HTMLElement>(root, "#render-error-detail");

let state: StartupState = INITIAL_STARTUP_STATE;
let graphics: WebGL2RenderingContext | null = null;
let gpu: GpuResources | null = null;
let renderer: InstancedRenderer | null = null;
let camera: OrthoCamera | null = null;
let gallery: ArtGallery | null = null;
const metrics = new RenderMetricWindow();
let frameHandle: number | null = null;
let priorFrameMs = 0;
let lastDisplayMs = 0;
let pageSuspended = false;

function stopFrames(): void {
  if (frameHandle !== null) cancelAnimationFrame(frameHandle);
  frameHandle = null;
  priorFrameMs = 0;
}

function releaseGpu(contextLost = false): void {
  stopFrames();
  const previousRenderer = renderer;
  const previousGpu = gpu;
  renderer = null;
  gpu = null;
  camera = null;
  gallery = null;
  if (previousRenderer) {
    if (contextLost) previousRenderer.abandonOnContextLoss();
    else previousRenderer.dispose();
  }
  if (previousGpu) {
    if (contextLost) previousGpu.abandonOnContextLoss();
    else previousGpu.dispose();
  }
}

function changeState(event: StartupEvent): void {
  state = transitionStartup(state, event);
  splash.hidden = state.view !== "splash";
  diagnostic.hidden = state.view !== "diagnostic";
  fatal.hidden = state.view !== "fatal";
  inspectButton.disabled = state.graphics !== "ready";
  status.textContent = state.detail;
  status.dataset.graphics = state.graphics;
}

function rendererFailed(error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  releaseGpu();
  graphics = null;
  root.dataset.renderState = "error";
  errorDetail.textContent = detail;
  errorOverlay.hidden = false;
  status.textContent = "Rendering interrupted. Retry to reinitialize WebGL2.";
}

function paintIfVisible(nowMs = performance.now()): void {
  if (state.view !== "diagnostic" || !graphics || !renderer) return;
  try {
    const bounds = canvas.getBoundingClientRect();
    const gpuMax = Number(graphics.getParameter(graphics.MAX_RENDERBUFFER_SIZE));
    const viewportMax = graphics.getParameter(graphics.MAX_VIEWPORT_DIMS) as Int32Array;
    const maxDimension = Math.max(1, Math.min(
      Number.isFinite(gpuMax) && gpuMax > 0 ? gpuMax : 4096,
      viewportMax?.[0] || 4096, viewportMax?.[1] || 4096, 4096,
    ));
    const preset = quality.value as ResolutionPreset;
    const resolution = computeCanvasResolution(
      bounds.width, bounds.height, window.devicePixelRatio || 1, preset,
      { maxDimension, maxPixels: 4_194_304 },
    );
    if (!resolution) return;

    resizeCanvas(canvas, resolution);
    if (!camera) camera = new OrthoCamera(bounds.width, bounds.height);
    else camera.resize(bounds.width, bounds.height);
    camera.snapTo([0, 1.6, 0]);
    if (!gallery) throw new Error("Authored gallery has not initialized");

    const frame = renderer.render(camera.matrices, gallery.instances);
    // Dev-only negative-path test: exercise the exact UI exception boundary.
    if (import.meta.env.DEV
      && new URLSearchParams(location.search).get("failRender") === "1") {
      throw new Error("Simulated diagnostic render failure");
    }
    metrics.push(priorFrameMs ? Math.max(0, nowMs - priorFrameMs) : 0, frame);
    priorFrameMs = nowMs;
    root.dataset.orientation = resolution.portrait ? "portrait" : "landscape";
    root.dataset.renderState = "active";
    canvas.dataset.renderState = "active";
    canvas.dataset.backbuffer = resolution.width + "x" + resolution.height;

    if (nowMs - lastDisplayMs > 450 || lastDisplayMs === 0) {
      lastDisplayMs = nowMs;
      details.textContent =
        (resolution.portrait ? "Portrait" : "Landscape") +
        " · CSS " + Math.round(bounds.width) + "×" + Math.round(bounds.height) +
        " · GPU " + resolution.width + "×" + resolution.height +
        " · effective scale " + resolution.pixelRatio.toFixed(2) +
        (resolution.limited ? " (budget limited)" : "");
      const trace = metrics.snapshot();
      metricsDisplay.textContent =
        "Draws " + trace.drawCalls + " · triangles " + trace.triangles +
        " · instances " + trace.instances +
        " · rAF interval p95 " + trace.frameP95Ms.toFixed(1) + "ms" +
        " · CPU submit p95 " + trace.cpuSubmitP95Ms.toFixed(2) + "ms" +
        " · samples " + trace.samples;
    }
  } catch (error) {
    rendererFailed(error);
  }
}

function scheduleFrames(): void {
  if (frameHandle !== null || state.view !== "diagnostic" || !renderer) return;
  frameHandle = requestAnimationFrame((now) => {
    frameHandle = null;
    paintIfVisible(now);
    scheduleFrames();
  });
}

function startDiagnostic(): void {
  if (state.view !== "diagnostic" || !renderer) return;
  errorOverlay.hidden = true;
  paintIfVisible();
  scheduleFrames();
}

function probeGraphics(): void {
  releaseGpu();
  metrics.reset();
  priorFrameMs = 0;
  lastDisplayMs = 0;
  errorOverlay.hidden = true;
  root.dataset.renderState = "checking";
  graphics = null;
  changeState({ type: "PROBE_START" });
  const result = probeWebGL2(canvas);
  if (!result.ok) {
    changeState({ type: "PROBE_FAILED", reason: result.reason });
    return;
  }

  // Real shader compile/link, buffer upload and VAO smoke test on this context.
  // It resets every temporary object; the owner remains for future renderer work.
  const owner = new GpuResources(result.gl);
  try {
    verifyRendererResources(owner);
  } catch (error) {
    owner.dispose();
    const detail = error instanceof Error ? error.message : "Unknown GPU initialization error";
    changeState({ type: "PROBE_FAILED", reason: "Renderer initialization failed: " + detail });
    return;
  }

  try {
    renderer = new InstancedRenderer(result.gl);
    gallery = createArtGallery(renderer);
  } catch (error) {
    renderer?.dispose();
    renderer = null;
    owner.dispose();
    const detail = error instanceof Error ? error.message : "Unknown renderer initialization error";
    changeState({ type: "PROBE_FAILED", reason: "Renderer initialization failed: " + detail });
    return;
  }
  gpu = owner;
  graphics = result.gl;
  changeState({ type: "PROBE_READY", version: result.version + " · GPU resources checked" });
}

root.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button");
  switch (button?.id) {
    case "show-diagnostic":
      changeState({ type: "SHOW_DIAGNOSTIC" });
      startDiagnostic();
      break;
    case "back-to-splash":
      stopFrames();
      changeState({ type: "SHOW_SPLASH" });
      break;
    case "retry-webgl2":
      probeGraphics();
      break;
    case "retry-renderer":
      probeGraphics();
      if (state.graphics === "ready") {
        changeState({ type: "SHOW_DIAGNOSTIC" });
        startDiagnostic();
      }
      break;
  }
});

root.addEventListener("change", (event) => {
  if (event.target === quality) {
    metrics.reset();
    priorFrameMs = 0;
    lastDisplayMs = 0;
    paintIfVisible();
  }
});

canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault(); // Required for a future webglcontextrestored event.
  releaseGpu(true);
  graphics = null;
  changeState({ type: "CONTEXT_LOST" });
});
canvas.addEventListener("webglcontextrestored", probeGraphics);

const resizeObserver = new ResizeObserver(() => paintIfVisible());
resizeObserver.observe(canvas);
window.addEventListener("resize", () => paintIfVisible());
window.addEventListener("pagehide", () => {
  pageSuspended = true;
  releaseGpu();
  graphics = null;
});
window.addEventListener("pageshow", () => {
  // Initial pageshow is NOT a recovery event. A first-frame renderer failure
  // must leave its error overlay visible until the user explicitly retries.
  if (!pageSuspended) return;
  pageSuspended = false;
  probeGraphics();
});
probeGraphics();

/** Development-only browser smoke path, never a gameplay route. */
if (import.meta.env.DEV && new URLSearchParams(location.search).get("diagnostic") === "1"
  && state.graphics === "ready") {
  changeState({ type: "SHOW_DIAGNOSTIC" });
  startDiagnostic();
}
