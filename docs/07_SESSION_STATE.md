# Session state — persistent development memory
Date: 2026-11-10
Project: Bastionfall
Canonical repository: lordfireballzmc/BrowserGame

## Current milestone
- F0.01 — **COMPLETE**, with GitHub Actions evidence. Strict TS/Vite/WebGL2 diagnostic scaffold, `package-lock.json` version 3, Node 22 workflow, npm scripts, and test harness are present.
- F0.02 — **COMPLETE**. Normal read-only cached npm CI passed on PR #1 at run 42738621062 (job 129573896738) and identical workflow content was merged into `main`; an independent post-merge push run was not retrieved.
- F0.03 — **COMPLETE**. Versioned deterministic PRNG, seeded crown rolls, typed game balance and tests. PR #2 GitHub Actions run 42741214912 job 129582441687 passed npm ci, typecheck, unit tests, build.
- F0.04 — **COMPLETE**. Fixed 60 Hz, bounded catch-up and pause/visibility-safe loop with fake-clock tests. PR #3 GitHub Actions run 42744507707 (job 129593281557) passed npm ci, typecheck, Vitest, and production build.
- F0.05 — **COMPLETE**. Accessible splash, typed startup state and WebGL2 capability probe, diagnostic canvas, explicit recovery state, context loss/restoration handling, and headless Chrome no-WebGL fallback test; CI run 42748722997 job 129606964561 success.
- Next work: F0.06 architecture decision records updated to actual locked dependency versions and attribution.
- Latest implemented product: honest engineering splash with WebGL2 diagnostic and tested fallback, plus deterministic game foundations; **not a playable game**.
- Host / preview URL: NONE configured. Visual or runtime browser QA: NOT performed.
- All remaining game/engine tasks after F0.05: not yet implemented.

## Verifiable build evidence
- [PR #1](https://github.com/lordfireballzmc/BrowserGame/pull/1): `bootstrap/f0-01-verified-lockfile`.
- GitHub Actions successful checks job **129567021617**, run **42736530618**: npm lockfile resolution, npm ci, typecheck, Vitest, Vite build and artifact export succeeded.
- Resolved lockfile uploaded as artifact `bootstrap-package-lock` (artifact ID **13727650742**) and then committed by the one-time branch-only workflow after verifying npm ci/typecheck/test/build.
- GitHub Actions successful checks job **129573896738**, run **42738621062**, on commit `70e541a0ecbcae378bfc2e1fdd4c6cbe60a34623`: npm cache initialization, `npm ci`, `npm run typecheck`, `npm test`, `npm run build` all completed successfully. Temporary write-permission workflow removed; normal CI has read-only permissions and dependency cache.
- No local npm install or browser screenshot was successfully executed in the ChatGPT container this session. Claims above are from GitHub Actions job steps, not inferred tests.

## Decisions
- Original hero-action tower defense, not copying Kingshot artwork/trademarks; only advertised fantasy as conceptual inspiration.
- Custom strict TypeScript/WebGL2 engine, small primitive libraries TWGL/gl-matrix; no Three.js.
- Authored deterministic procedural geometry and fixed-step simulation, exact aesthetic and animation bible.
- Verify every milestone before checking it off. No fake demos, screenshots or benchmarks.
- GitHub is long-term memory. Read `AGENTS.md` at each iteration.

## Journal
- 2026-11-10: design docs and execution backlog prepared.
- 2026-11-10: basic Vite/TS WebGL2 diagnostic scaffold committed but initially unverified.
- 2026-11-10: discovered missing package-lock preventing workflow cache, opened PR #1, generated and committed lockfile through a short-lived restricted workflow after CI verification.
- 2026-11-10: switched normal CI to cached npm ci and verified green status. Marked F0.01 complete.

## Next-session protocol
1. Fetch `AGENTS.md`, this file and `docs/06_EXECUTION_BACKLOG.md`; inspect latest main head and PR #1 merge state.
2. If PR remains open, verify green CI on latest head and complete merge when safe. If already merged, inspect main CI.
3. Verify PR #4 merge state (F0.05), then implement F0.06 versioned architecture decisions and third-party attribution. Inspect main CI when available.
4. Preserve strict truthfulness: do not claim deployment, playable graphics, or end-to-end browser interaction yet.

- 2026-11-10 (continuation): F0.02 accepted based on successful normal cached npm CI in PR #1, merged unmodified into main. Added F0.03 on branch `feat/f0-03-deterministic-balance`: `src/game/Random.ts` (versioned xorshift32 PRNG with FNV-1a string seeds, snapshot, unbiased inclusive integer rolls), `src/game/Balance.ts` (canonical typed hero/core/enemy/tower/economy values), and `tests/foundation.test.ts` (golden vectors, replay, bounds, balance). Tests newly authored but no verified CI yet. No playable change; pending PR CI.

- 2026-11-10: F0.03 GitHub Actions run 42741214912 job 129582441687 COMPLETED success; npm ci, typecheck, Vitest and Vite build all green on PR #2. Backlog marked [x]; next F0.04. PR must still be merged into main; check PR merge state next turn.

- 2026-11-10: F0.04 implemented on `feat/f0-04-fixed-step-loop` with `src/engine/Loop.ts` and `tests/loop.test.ts`. Run 42744507707, job 129593281557: all CI steps success, including nine fake-clock tests, strict typechecking, and production build. Task marked [x]. No browser runtime or visual claim; this is an independently testable foundation that is not yet wired into the diagnostic app. Next F0.05. PR #3 must still be merged; verify current head CI first.

- 2026-11-10: F0.05 on branch `feat/f0-05-startup-fallback`: `src/platform/Startup.ts`, `src/main.ts`, `src/style.css`, `tests/startup.test.ts`, and expanded CI smoke check. TypeScript first reported nullability errors; fixed via requiredNode accessor. Final GitHub Actions run 42748722997 job 129606964561: **success**, `npm ci`, typecheck, 4 test files / 30 Vitest tests, Vite production build, actual Chrome headless DOM execution with `--disable-webgl` confirming `data-graphics="unavailable"` fallback. Verified negative WebGL2 path and HTML execution, not visual gameplay or positive GPU screenshot. Marked F0.05 [x]. Next F0.06, PR #4 merge pending at time of writing.
