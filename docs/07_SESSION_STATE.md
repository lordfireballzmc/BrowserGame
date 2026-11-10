# Session state — persistent development memory
Date: 2026-11-10
Project: Bastionfall
Canonical repo: lordfireballzmc/BrowserGame
Stage: F0 — bootstrapping
Current task: F0.01 — **PARTIAL, NOT VERIFIED**
Current GitHub files: project docs 01–08, AGENTS.md, TS/Vite/WebGL2 diagnostic scaffold, CI YAML, README, single smoke test.
Code committed: YES; a WebGL2 capability diagnostic only, not a game.
Dependencies researched: YES; integrated and executed: NOT VERIFIED.
package-lock.json: MISSING; npm install required; CI currently uses npm install.
GitHub Actions check: workflow committed; combined commit status queried and no statuses returned; success NOT VERIFIED.
Build/test execution: NONE recorded; do not mark F0.01 or F0.02 done.
Visual inspection: NONE. WebGL2 screen is a diagnostic and not game artwork.
Playable build: NONE.
Live URL/hosting: NONE.
Next work: finish F0.01 with real dependency resolution, npm build/typecheck/test; commit package lock. Then fix CI to npm ci and verify F0.02. If current chat tools cannot execute repo in isolated environment, leave pending and report inability, don't fake PASS.
Need from user: local installation of existing chat extension not required for code edits. User can start controlled turns after verifying setup.

## Decisions
- Gameplay references CreativeScope KS-02 (YouTube/AdMob flight) and AdMapix 9aef... sample. These analyses are secondary; project has not played source MP4 independently.
- Original hero-action tower-defense loop, no copied Kingshot visual assets or brand.
- Custom TS/WebGL2 engine with TWGL and gl-matrix primitives, no Three.js.
- Explicit procedural art grammar; deterministic fixed-tick simulations.
- Small repository commits, truthful tests/verification, no invented deployments.
- GitHub is the memory between chat turns; read AGENTS.md before each.

## Journal
- 2026-11-10: authored detailed reference/game/art/architecture/open-source docs and 9-phase task backlog, GitHub protocol.
- 2026-11-10: created package.json, strict TS config, index.html, diagnostic page, smoke test, Actions workflow. No install/build executed; leave F0.01 unchecked.
- 2026-11-10: README added, user-specific first/repeat prompt committed.

## Next session instruction
Fetch latest AGENTS.md + docs and current main SHA; verify repository state; inspect CI; focus on F0.01 until build is genuinely green. Stop on access/limit/error, do not loop without progress.

- 2026-11-10 (continuation): F0.01 investigation found missing package-lock.json and setup-node npm cache depending on an absent lockfile. Local Node 22.16/npm 10.9 present but registry request failed EAI_AGAIN; no local build tests verified. Created branch `bootstrap/f0-01-verified-lockfile`, changed Actions workflow to generate a reproducible package-lock.json on GitHub runner, install with npm ci, run typecheck/test/build and upload lockfile artifact. This is an **unverified CI bootstrap fix**, not F0.01 completion. Next: inspect PR CI job, obtain/commit lockfile to main, restore npm cache, verify fresh npm ci and build before marking F0.01/F0.02 done.
