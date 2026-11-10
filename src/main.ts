import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("App element #app is missing");

root.innerHTML = `
  <main class="frame" aria-labelledby="title">
    <header>
      <div class="eyebrow">BASTIONFALL / ENGINEERING PREVIEW</div>
      <h1 id="title">The frontier isn't built yet.</h1>
      <p>Custom WebGL2 engine initialization. This screen is a diagnostic scaffold, not gameplay or final artwork.</p>
    </header>
    <section class="viewport" aria-label="WebGL2 engine diagnostic canvas">
      <canvas id="game" aria-label="Future game canvas"></canvas>
      <div class="diagnostic" id="diagnostic" role="status"></div>
    </section>
    <footer>
      <span>Engine: WebGL2</span>
      <span>Project phase: F0</span>
      <span>Original game · Original procedural art</span>
    </footer>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const status = document.querySelector<HTMLDivElement>("#diagnostic");
if (!canvas || !status) throw new Error("Diagnostics unavailable");

const gl = canvas.getContext("webgl2", {
  antialias: true,
  alpha: false,
  depth: true,
  powerPreference: "high-performance",
});
if (!gl) {
  status.textContent = "WebGL2 unavailable. Use a current browser with hardware acceleration enabled.";
  status.classList.add("failure");
} else {
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.831, 0.859, 0.824, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };
  window.addEventListener("resize", resize);
  resize();
  status.textContent = `WebGL2 ready — ${gl.getParameter(gl.VERSION) as string}. Renderer and gameplay pending.`;
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    status.textContent = "Graphics context lost. Restore or reload to continue.";
    status.classList.add("failure");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    status.classList.remove("failure");
    resize();
    status.textContent = "WebGL2 context restored. Engine initialization pending.";
  });
}
