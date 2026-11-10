# Bastionfall — original browser tower-defense game

**Private repository:** `lordfireballzmc/BrowserGame`  
**Status:** F0/F1 foundations and F2.01–F2.07 world/render foundations are implemented: island, winding road, ten pads, northern river, and 258 reproducibly seeded scenery props. The browser contains an original archetype gallery and a separate WebGL2 world inspection preview with projected pad prices and click selection, plus **staged** 3D heroes/raiders, an authored keep, optional cinematic compositions, and soft directional WebGL2 shadows. **A limited F3.02 movement-and-raider-march study lets you control the Warden while original 3D Scrappers/Runners visibly traverse the authored road. Combat, purchases and full waves are not playable yet.** No public deployment or live game URL.  
**Goal:** an honest, satisfying playable interpretation of the *advertised* real-time defense/collect/build fantasy in Kingshot-style mobile promotions, built with original IP, procedural geometry and a custom WebGL2 engine.

## Where to start

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Mandatory per-turn developer protocol |
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

Open the URL printed by Vite. The main app displays a startup screen and a **four-archetype WebGL2 gallery** through its diagnostic button, plus **Move the Warden · early prototype**, which opens `/tests/terrain-preview.html?view=movement` with WASD/arrow movement, fixed 60Hz physics, ground/keep/river collisions, a follow camera, 3D shadowed scenery, Esc-to-pause and a **simulation-driven approaching column** of original 3D raiders. Use `&aspect=portrait` for a 9:16 preview. The enemy march **starts 30 simulated seconds into a scripted wave-two approach to make the silhouettes visible immediately**, and has exact scripted 14 Scrappers / five Runners; this is keyboard-only and does not yet include enemy attacks, shooting, purchases or a finished mobile control scheme. While the dev server is running, visit `/tests/terrain-preview.html` to view the separately rendered **72×48m island, 4.5m road, ten stone pads, northern river, two timber crossings, and 258 seed-reproducible trees/rock/grass/flower accents**. Clicking a wave-1 pad selects it in this engineering preview; **tower purchases, combat and fully functioning waves do not exist yet**. The home screen links to `/tests/terrain-preview.html?view=cinematic` for a composed 1920×1080 original 3D scene; use `&aspect=portrait` for a separately framed 1080×1920 study. The characters/defenses in these studies are posed visual models, not simulated combat. See `docs/15_F2_06_LIGHTING_REVIEW.md` for lighting and screenshot evidence and remaining art-quality gaps. The lockfile is committed; GitHub Actions runs `npm ci`, typechecking, the unit test suite, a production build, and headless-Chrome graphics, responsive layout, terrain and fallback checks. Development server `--host 0.0.0.0` exposes its port to the local network by default; use appropriate firewall controls.

## Creative and legal boundary
No Kingshot assets, logos or characters included; this is original art and code, using the genre's broad concepts. Direct third-party package versions, tagged upstream license references and runtime notices are maintained in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Full transitive licensing and release artifacts must be audited before shipping (F8.03). This is a working game title, not a finalized trademark.

## Development control
User retains control over repository, browser extension, deployment and spending. The extension is not part of this repository. Never label a dependency linked in a doc as 'integrated' until code actually imports it, passes build and is verified.
