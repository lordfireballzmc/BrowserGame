# Bastionfall — original browser tower-defense game

**Private repository:** `lordfireballzmc/BrowserGame`  
**Status:** F0/F1 foundations and F2.01–F2.07 world/render foundations are implemented: island, winding road, ten pads, northern river, and 258 reproducibly seeded scenery props. The browser contains an original archetype gallery and a separate WebGL2 world inspection preview with projected pad prices and click selection, plus **staged** 3D heroes/raiders, an authored keep, optional cinematic compositions, and soft directional WebGL2 shadows. **F3.03 adds genuine 7m Warden auto-fire: original 3D copper bolts travel at 15m/s and can physically hit the marching Scrappers/Runners, permanently lowering their HP. Enemy attacks, coin payouts, tower purchases and full waves are still not playable.** Deployment workflow is being added; the public playable URL must be verified before it is announced.  
**Goal:** a real playable original illustrated 3D fantasy-defense game with sharp high-density rendering, professionally authored coherent 3D assets, expressive animation and fluid combat. The primary current renderer is Three.js/WebGL2 with deterministic TypeScript gameplay; promotional screenshots are historic craft references, **not** the chosen art style.

## Play the latest build online — deployment setup

**CURRENT STATUS: compiled site, bundled GLBs, and real production Chrome gameplay tests PASS; public deployment BLOCKED until GitHub Pages is enabled.** [First publishing run](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42894651796) uploaded the artifact but its `configure-pages` step returned `Get Pages site failed: Not Found`. Go to [Settings → Pages](https://github.com/lordfireballzmc/BrowserGame/settings/pages), select **GitHub Actions** as Source (private Pages requires GitHub Pro/Team/Enterprise), then rerun the publishing workflow. The intended URL is **not yet verified live**.


**Intended stable project URL:** `https://lordfireballzmc.github.io/BrowserGame/` — **do not describe as live until Pages deployment succeeds and HTTP/browser checks confirm it**.

**Playable test scene:** `https://lordfireballzmc.github.io/BrowserGame/tests/terrain-preview.html?view=movement&quality=sharp` (Warden movement + raiders + bolts, **not** finished tower defense). The website gets rebuilt on every push to `main` through `.github/workflows/publish-playable.yml`, with a production-build browser smoke gate before publishing. PRs validate the production bundle but do not deploy.

**One-time GitHub account setup may be necessary:** [Repository Settings → Pages](https://github.com/lordfireballzmc/BrowserGame/settings/pages) → Build and deployment → Source → **GitHub Actions**. The source repo remains PRIVATE; GitHub Pages on a private repository requires GitHub Pro/Team/Enterprise. GitHub Pages **publishes a publicly viewable site** even if code remains private. If GitHub Pages is not available on the account, do not change repository visibility without the owner's explicit approval; use a private-repo-compatible alternative hosting provider after connecting the appropriate credentials.

Deployment setup, restrictions, exact links and validation: [docs/31_PERMANENT_PLAYABLE_SITE.md](docs/31_PERMANENT_PLAYABLE_SITE.md). A green build is not proof of a live URL; confirm the Pages deployment **and HTTP 200 + actual game in the browser**.

## Binding sharpness, fluidity and production-quality mandate (2026-11-10)

**Read first:** [VQ directive](docs/29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md) and [art north star](docs/20_VISUAL_NORTH_STAR.md). **VQ.01 high-DPI rendering is verified; VQ.02a visual environment slice is now merged:** [PR #31](https://github.com/lordfireballzmc/BrowserGame/pull/31) added six source-pinned Kenney CC0 textured GLB models forming an illustrated blue-roof keep with twin windowed turrets and ten gold/azure architectural tower pads in the **actual gameplay scene**. [CI #42898990215](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42898990215) passed 196 tests, Chrome real combat, and landscape/portrait before/after captures. [See actual screenshot comparison and critical review](docs/32_VQ02A_KENNEY_CASTLE_ART_REVIEW.md). **NEXT VQ.02b** original higher-fidelity environmental/foliage/keep art and **F3.04** crown/gameplay; source assets remain non-exclusive, visual target not yet met.

## Production mandate and asset-first pilot (2026-11-10)

**[Read the full user-supplied professional studio directive](docs/00_MASTER_PRODUCTION_DIRECTIVE.md).** Its delivery objective is a complete, responsive, richly textured, professionally animated, mobile-compatible **original** illustrated 3D defense game. The user expressly authorized replacing the inadequate procedural-only asset pipeline. The existing deterministic simulation is retained. ART.01 first proved real Three.js GLTFLoader and a source-pinned locally bundled CC0 wooden lantern, and ART.02a has **now superseded the earlier dual-canvas pilot**: the normal `/tests/terrain-preview.html?view=movement` draws the old world and imported model through **one WebGL2 scene**, with a supported legacy fallback. Character art, animation and commercial-level art parity are **not yet achieved**. See [ADR-023](docs/23_ASSET_FIRST_THREE_MIGRATION_ADR.md) and [ART.02 review](docs/25_ART02_SINGLE_SCENE_REVIEW.md).

## ART.02 renderer update — one shared Three.js gameplay scene

The default Warden preview at `/tests/terrain-preview.html?view=movement` now uses **one Three.js/WebGL2 scene, one canvas and shared depth + directional shadows** for the original terrain, keep, moving Warden/raiders, physical copper projectiles and the source-verified locally bundled CC0 textured Lantern. The obsolete two-canvas `ImportedArtLayer` was deleted. The original renderer is retained as an explicit regression fallback via `?renderer=legacy`; **ART.02b additionally migrates the full-island map, P01/P09 pad selection, and both cinematic views into the same unified Three scene**. The separate diagnostic/gallery and old-engine compatibility tests still use legacy code until equivalent coverage exists. Real Chrome landscape/portrait/pad-click verification: [Actions #42832578697](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42832578697). This is a technical rendering milestone **not a high-quality asset/animation makeover**. Read [ART.02 screenshot review](docs/25_ART02_SINGLE_SCENE_REVIEW.md).

## ART.03a — actual 3D skeletal character art

Source-pinned CC0 KayKit Knight (Warden), Barbarian (Scrapper), and Hooded Rogue (Runner) GLB models now supply **real skinning, sculpted 3D anatomy, texture atlas, and original authored Idle/Walk/Run/Attack/Death animation**, instead of the old whole-mesh-bob characters, in the unified Three.js game scene. The full set is locally bundled and optimized to **1.66 MB** total, with exact source Git pins and per-asset SHA256 in `public/assets/characters/manifest.json` and the [license notices](THIRD_PARTY_NOTICES.md). Failed external model imports retain the older primitive visual fallback; no runtime CDN. First [CI 42838208953](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42838208953) passed 187 tests and real browser 20-skinned-actor combat views; subsequent faction color read (blue Warden vs crimson enemies) is subject to final art review. Read [ART03a scene critique](docs/27_ART03A_RIGGED_CHARACTERS_REVIEW.md).

These models are **licensed third-party starter assets**, not the final exclusive Bastionfall designs. The environment, attack sockets, skeletal performance and mobile UI still need serious improvements.

## ART.03b — Layered fantasy costumes, authentic equipment and smoother skeletal transitions

The live Three.js Warden/Scrapper/Runner models now receive **eight region-specific illustrated materials per role**, derived from true named GLB mesh parts (helmet, face, body, limbs, cape, weapon and shield) instead of a single plastic-looking faction tint. Selected source-authored hand-socket accessories are limited to the Warden sword/shield, Scrapper axe/shield and Runner small crossbow/offhand knife rather than stacking every weapon variant. The existing 41-joint KayKit CC0 rigs now **smoothstep-crossfade** 140ms when switching their actual Idle/Walk/Run/Attack/Death animations, entirely visual and sampled from deterministic world time. First [ART.03b CI #42850500809](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42850500809) passed 192 unit tests, browser movement/combat/pad selection and both screen orientations. First actual screenshots showed the Warden's helmet **too gold** and raiders' hats **too brown**; revised blue helmet and brighter crimson headgear require final browser visual verification, not yet proof of commercial-quality character art. See [ART.03b review](docs/28_ART03B_CHARACTER_IDENTITY_REVIEW.md).

## Current art-direction decision (2026-11-10)

The user explicitly rejected the overly glossy, realistic *Rise of Kingdoms*-leaning Bastionfall AI mockups and instead wants an **original, playful, illustrated-cartoon tower defense in genuinely sculpted 3D**, drawing only general readability/personality/motion inspiration from *Kingdom Rush* (no copying third-party characters, maps, UI or game art). This decision **overrides older muted mobile-strategy styling** for future visual tasks; it does **not** mean the current runtime already meets that level.

Every new chat and visible task must read [the visual north star](docs/20_VISUAL_NORTH_STAR.md), [the original in-repo SVG target](docs/visual-references/target-illustrated-3d-composition.svg), [the visual-reference index](docs/visual-references/README.md), and [the visual review log](docs/21_VISUAL_REVIEW_HISTORY.md). The reference artwork is an **aspirational guide**, not a screenshot of shipped WebGL2 graphics.

## Where to start

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Mandatory per-turn developer protocol |
| [VQ visual-fidelity and fluidity directive](docs/29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md) | Binding quality policy and remaining VQ.02b/VQ.03/VQ.04 priorities |
| [VQ.02a real castle/pad screenshot review](docs/32_VQ02A_KENNEY_CASTLE_ART_REVIEW.md) | Source-pinned CC0 art integration, exact Chrome before/after frames, shortcomings and further work |
| [docs/20_VISUAL_NORTH_STAR.md](docs/20_VISUAL_NORTH_STAR.md) | Latest authoritative visual taste decision: illustrated expressive 3D cartoon, not glossy strategy realism |
| [docs/visual-references/README.md](docs/visual-references/README.md) | Version-controlled original visual composition and concept generation recipes |
| [docs/21_VISUAL_REVIEW_HISTORY.md](docs/21_VISUAL_REVIEW_HISTORY.md) | Record of rejected looks, what user actually wants, and remaining runtime-art gaps |
| [docs/01_REFERENCE_ANALYSIS.md](docs/01_REFERENCE_ANALYSIS.md) | Exactly which advertised creative is under study; evidence limitations |
| [docs/02_GAME_DESIGN_BIBLE.md](docs/02_GAME_DESIGN_BIBLE.md) | Full game rules, numbers, wave schedule, controls, economy, tower types |
| [docs/03_ART_AND_ANIMATION_BIBLE.md](docs/03_ART_AND_ANIMATION_BIBLE.md) | Enforced color palette, geometry, character construction, animation timing |
| [docs/04_OPEN_SOURCE_COMPONENTS.md](docs/04_OPEN_SOURCE_COMPONENTS.md) | Links, licenses, responsibilities and test strategy for candidate GitHub libraries |
| [docs/05_ARCHITECTURE.md](docs/05_ARCHITECTURE.md) | Custom engine module plan / data ownership |
| [docs/06_EXECUTION_BACKLOG.md](docs/06_EXECUTION_BACKLOG.md) | Ordered task list F0–F8 with dependencies and verification gates |
| [docs/07_SESSION_STATE.md](docs/07_SESSION_STATE.md) | GitHub-based memory across ChatGPT turns |
| [docs/08_INITIAL_PROMPTS.md](docs/08_INITIAL_PROMPTS.md) | One-time initialization and repeated development prompts |
| [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) | Exact resolved third-party versions, tagged license evidence, and attribution notices |
| [docs/09_F1_06_ART_REVIEW.md](docs/09_F1_06_ART_REVIEW.md) | Real Chrome screenshot inspection of the first original hero, enemies and keep |
| [docs/10_F2_01_TERRAIN_REVIEW.md](docs/10_F2_01_TERRAIN_REVIEW.md) | Real Chrome screenshot and 72×48m island seam/rock evidence |
| [docs/11_F2_02_ROAD_REVIEW.md](docs/11_F2_02_ROAD_REVIEW.md) | Reviewed road-and-island screenshot, collision lane tests and remaining limitations |
| [docs/12_F2_03_PADS_REVIEW.md](docs/12_F2_03_PADS_REVIEW.md) | Real browser screenshot, ten build-pad coordinates, prices and selection evidence |
| [docs/13_F2_04_RIVER_REVIEW.md](docs/13_F2_04_RIVER_REVIEW.md) | Northern river/bridge screenshot, slope safety and real WebGL2 evidence |
| [docs/14_F2_05_SCENERY_REVIEW.md](docs/14_F2_05_SCENERY_REVIEW.md) | Seeded original vegetation/rocks/flowers, exclusion tests and real Chrome screenshot |

## Run locally (requires Node.js 22+ and npm)

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Open the URL printed by Vite. The main app displays a startup screen and a **four-archetype WebGL2 gallery** through its diagnostic button, plus **Move the Warden · early prototype**, which opens `/tests/terrain-preview.html?view=movement` with WASD/arrow movement, fixed 60Hz physics, ground/keep/river collisions, a follow camera, 3D shadowed scenery, Esc-to-pause and a **simulation-driven approaching column** of original 3D raiders. Use `&aspect=portrait` for a 9:16 preview. The enemy march **starts 30 simulated seconds into a scripted wave-two approach to make the silhouettes visible immediately**, and has exact scripted 14 Scrappers / five Runners; this is keyboard-only and now includes automatic Warden bolts, actual damage and small hit glints, but **not** enemy counterattacks, coin/kill rewards, tower purchases or a finished mobile control scheme. While the dev server is running, visit `/tests/terrain-preview.html` to view the separately rendered **72×48m island, 4.5m road, ten stone pads, northern river, two timber crossings, and 258 seed-reproducible trees/rock/grass/flower accents**. Clicking a wave-1 pad selects it in this engineering preview; **tower purchases, enemy attacks, full kill rewards and functioning wave progression do not exist yet**. The home screen links to `/tests/terrain-preview.html?view=cinematic` for a composed 1920×1080 original 3D scene; use `&aspect=portrait` for a separately framed 1080×1920 study. The characters/defenses in these studies are posed visual models, not simulated combat. See `docs/15_F2_06_LIGHTING_REVIEW.md` for lighting and screenshot evidence and remaining art-quality gaps. The lockfile is committed; GitHub Actions runs `npm ci`, typechecking, the unit test suite, a production build, and headless-Chrome graphics, responsive layout, terrain and fallback checks. Development server `--host 0.0.0.0` exposes its port to the local network by default; use appropriate firewall controls.

## Creative and legal boundary
No Kingshot assets, logos or characters included; this is original art and code, using the genre's broad concepts. Direct third-party package versions, tagged upstream license references and runtime notices are maintained in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Full transitive licensing and release artifacts must be audited before shipping (F8.03). This is a working game title, not a finalized trademark.

## Development control
User retains control over repository, browser extension, deployment and spending. The extension is not part of this repository. Never label a dependency linked in a doc as 'integrated' until code actually imports it, passes build and is verified.
