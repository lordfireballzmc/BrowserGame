# Session state — persistent development memory
Date: 2026-11-10
Project: Bastionfall
Canonical repository: lordfireballzmc/BrowserGame

## Current milestone
- F0.01 — **COMPLETE**, with GitHub Actions evidence. Strict TS/Vite/WebGL2 diagnostic scaffold, `package-lock.json` version 3, Node 22 workflow, npm scripts, and test harness are present.
- F0.02 — **COMPLETE**. Normal read-only cached npm CI passed on PR #1 at run 42738621062 (job 129573896738) and identical workflow content was merged into `main`; an independent post-merge push run was not retrieved.
- F0.03 — **IN REVIEW**: deterministic PRNG v1 with golden vectors, seeded coin integer generator, immutable typed balance schema, Vitest tests. PR CI not yet verified; keep [~] until green.
- Latest implemented product: browser WebGL2 capability diagnostic screen, **not a playable game**.
- Host / preview URL: NONE configured. Visual or runtime browser QA: NOT performed.
- All remaining game/engine tasks except F0.03: not yet implemented.

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
3. Check F0.03 PR and Vitest build results; fix failures before marking [x]; check main Actions after merge when accessible.
4. Preserve strict truthfulness: do not claim deployment, playable graphics, or end-to-end browser interaction yet.

- 2026-11-10 (continuation): F0.02 accepted based on successful normal cached npm CI in PR #1, merged unmodified into main. Added F0.03 on branch `feat/f0-03-deterministic-balance`: `src/game/Random.ts` (versioned xorshift32 PRNG with FNV-1a string seeds, snapshot, unbiased inclusive integer rolls), `src/game/Balance.ts` (canonical typed hero/core/enemy/tower/economy values), and `tests/foundation.test.ts` (golden vectors, replay, bounds, balance). Tests newly authored but no verified CI yet. No playable change; pending PR CI.
