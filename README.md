# Bastionfall — original browser tower-defense game

**Private repository:** `lordfireballzmc/BrowserGame`  
**Status:** F0.01–F0.06 implemented and CI-verified. All F0 foundational tasks are complete; F1 rendering work is next. The browser shows a startup/graphics diagnostic, **not playable gameplay**. No public deployment or live game URL.  
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

## Run locally (requires Node.js 22+ and npm)

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Open the URL printed by Vite. The current build displays an engineering splash and a WebGL2 diagnostic (with a tested unavailable-graphics fallback), **not a playable game**. The lockfile is committed, and GitHub Actions runs `npm ci`, typechecking, unit tests, a production build, and headless-Chrome fallback smoke checks. Development server `--host 0.0.0.0` exposes its port to the local network by default; use appropriate firewall controls.

## Creative and legal boundary
No Kingshot assets, logos or characters included; this is original art and code, using the genre's broad concepts. Direct third-party package versions, tagged upstream license references and runtime notices are maintained in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Full transitive licensing and release artifacts must be audited before shipping (F8.03). This is a working game title, not a finalized trademark.

## Development control
User retains control over repository, browser extension, deployment and spending. The extension is not part of this repository. Never label a dependency linked in a doc as 'integrated' until code actually imports it, passes build and is verified.
