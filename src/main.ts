import "./style.css";
import {
  INITIAL_STARTUP_STATE,
  paintGraphicsDiagnostic,
  probeWebGL2,
  transitionStartup,
  type StartupEvent,
  type StartupState,
} from "./platform/Startup";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("App element #app is missing");

// F0.05 is an honest engineering splash, NOT an interactive game or asset preview.
root.innerHTML = `
  <main class="shell" aria-label="Bastionfall engineering preview">
    <header class="masthead">
      <span class="brand-mark" aria-hidden="true">B</span>
      <span>BASTIONFALL</span>
      <span class="build-label">ENGINEERING BUILD · F0</span>
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
      <div class="viewport">
        <canvas id="game" aria-label="Plain WebGL2 clear-color diagnostic canvas"></canvas>
      </div>
      <p class="preview-note">A correctly initialized GPU clears this canvas to a neutral meadow tone. No game world is rendered.</p>
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
      <span>Development milestone F0.05</span>
    </footer>
  </main>
`;

const splash = root.querySelector<HTMLElement>("#splash");
const diagnostic = root.querySelector<HTMLElement>("#diagnostic-screen");
const fatal = root.querySelector<HTMLElement>("#fatal-screen");
const status = root.querySelector<HTMLElement>("#startup-status");
const inspectButton = root.querySelector<HTMLButtonElement>("#show-diagnostic");
const canvas = root.querySelector<HTMLCanvasElement>("#game");
if (!splash || !diagnostic || !fatal || !status || !inspectButton || !canvas) {
  throw new Error("Startup DOM structure is incomplete");
}

let state: StartupState = INITIAL_STARTUP_STATE;
let graphics: WebGL2RenderingContext | null = null;

function changeState(event: StartupEvent): void {
  state = transitionStartup(state, event);
  splash.hidden = state.view !== "splash";
  diagnostic.hidden = state.view !== "diagnostic";
  fatal.hidden = state.view !== "fatal";
  inspectButton.disabled = state.graphics !== "ready";
  status.textContent = state.detail;
  status.dataset.graphics = state.graphics;
}

function paintIfVisible(): void {
  if (state.view !== "diagnostic" || !graphics) return;
  try {
    paintGraphicsDiagnostic(canvas, graphics, window.devicePixelRatio);
  } catch {
    graphics = null;
    changeState({
      type: "PROBE_FAILED",
      reason: "WebGL2 initialized but could not draw. Check your graphics driver and retry.",
    });
  }
}

function probeGraphics(): void {
  changeState({ type: "PROBE_START" });
  const result = probeWebGL2(canvas);
  if (!result.ok) {
    graphics = null;
    changeState({ type: "PROBE_FAILED", reason: result.reason });
    return;
  }
  graphics = result.gl;
  changeState({ type: "PROBE_READY", version: result.version });
}

root.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button");
  switch (button?.id) {
    case "show-diagnostic":
      changeState({ type: "SHOW_DIAGNOSTIC" });
      paintIfVisible();
      break;
    case "back-to-splash":
      changeState({ type: "SHOW_SPLASH" });
      break;
    case "retry-webgl2":
      probeGraphics();
      break;
  }
});

canvas.addEventListener("webglcontextlost", (event) => {
  event.preventDefault(); // Required for a future webglcontextrestored event.
  graphics = null;
  changeState({ type: "CONTEXT_LOST" });
});
canvas.addEventListener("webglcontextrestored", () => {
  probeGraphics();
});

window.addEventListener("resize", paintIfVisible);
probeGraphics();
