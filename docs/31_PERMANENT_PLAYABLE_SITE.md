# Permanent playable Bastionfall preview — publishing runbook

## Goal
Make the ACTUAL Three.js Warden combat preview accessible from a stable link, refreshed automatically after pushes to `main`. Source code is currently in a **private** GitHub repo. This is a working prototype (Warden movement and automatic bolts, raider march) — not finished tower defense; no purchases/rewards/complete waves.

### Intended URLs (NOT VERIFIED LIVE until Pages deployment succeeds)
- Landing page: `https://lordfireballzmc.github.io/BrowserGame/`
- Direct PLAY/TEST: `https://lordfireballzmc.github.io/BrowserGame/tests/terrain-preview.html?view=movement&quality=sharp`
- Portrait preview: `https://lordfireballzmc.github.io/BrowserGame/tests/terrain-preview.html?view=movement&aspect=portrait&quality=sharp`

These addresses are **standard GitHub Pages project URLs**, not custom DNS the repository owns. Treat a 404 as not deployed; never advertise a guessed link as working.

## Implementation
- Vite multi-page build (`vite.config.mjs`) outputs both `index.html` and `tests/terrain-preview.html`, with base `/BrowserGame/` in the deploy workflow and `/` in local dev.
- Source homepage links and fully bundled glTF/GLB model fetch URLs resolve with Vite `import.meta.env.BASE_URL`; movement-page maps and MENU use nested relative links.
- `scripts/check-pages-build.mjs` requires the built game HTML, bundled JavaScript and all four GLB assets; the static production browser test serves the *built dist*, not a dev-server approximation, and verifies 19 raiders, Warden, physical bolts and rigged character readiness in landscape/portrait.
- `.github/workflows/publish-playable.yml` runs on pushes to `main`, and also validates PR builds without deploying. Only the compiled `dist/` (not private source, git data or internal docs) is uploaded as the public Pages artifact. An HTTPS site and public client-side JavaScript assets are inherently accessible to visitors.
- The separate repository Build and Test workflow remains authoritative for full unit and browser suite; published-site verification is an additional production smoke gate.

## First actual deployment result — BLOCKED, exact evidence
- [Workflow #42894651796](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42894651796), triggered on merged commit `77f1ca51c9088dac7d4ce54ccc415754f8278e06`: **production build, GLB artifact check, Chrome landscape/portrait play tests and Pages artifact upload all SUCCEEDED**.
- The deployment job failed in **`actions/configure-pages@v5`** with **`Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions … Error: Not Found`**. The Pages deploy action was skipped. The website is **not** published or verified at the intended URL.
- **Only one setup action should be needed on eligible GitHub plans:** owner selects **Settings → Pages → Build and deployment Source → GitHub Actions**, then manually reruns the workflow or makes a push to `main`. No source visibility changes, new hosting credentials or separate payments should be made without explicit authorization. If Pages cannot be enabled for a private source repo under this account's plan, choose a private-repo-compatible static hosting alternative.

## GitHub Pages one-time eligibility and enablement
1. Open [Settings → Pages](https://github.com/lordfireballzmc/BrowserGame/settings/pages).
2. Under **Build and deployment**, select **GitHub Actions** as Source.
3. The private repository requires a GitHub **Pro, Team or Enterprise** entitlement for GitHub Pages. GitHub Free only supports Pages for public repositories; do **not** make the code public without explicit owner consent.
4. The website **itself is public** on GitHub Pages even when the source repository is private on eligible plans. Before shipping proprietary assets/data, audit everything in `dist` — private source access is not the same as a private website.
5. After enabling Pages, push/merge a change to `main` or manually trigger [Publish Playable Bastionfall](https://github.com/lordfireballzmc/BrowserGame/actions/workflows/publish-playable.yml) (no stored external hosting token required for a configured Pages site).
6. Confirm deploy job is green with a real `page_url`, then independently load both HTTPS URLs and test actual Warden controls. A green *build* job without green *deploy* does NOT mean the permanent link works.

### If Settings → Pages is unavailable
Do not falsely claim the site is live. Options: connect a private-GitHub-repo compatible third-party static host with appropriate account credentials (e.g., Cloudflare Pages/Netlify/Vercel), or obtain eligible GitHub Pages access. Avoid public repo/source visibility changes without explicit approval. The production build is host-agnostic; changing `BASTIONFALL_PUBLIC_BASE` lets a future deployment target root `/`.

## Verification truth
Deployment status is not inferred from guessed `github.io` paths. Each production workflow run must confirm both built entries and real browser WebGL2/GLB assets. If the site activation step is blocked, report the precise Github action error and owner setup requirement. Real browser software-GPU capture does not prove mobile FPS or completed gameplay.
