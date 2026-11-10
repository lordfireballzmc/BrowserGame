# Session state — persistent development memory
Date: 2026-11-10
Project: Bastionfall
Canonical repository: lordfireballzmc/BrowserGame

## Current milestone
- F0.01 — **COMPLETE**, with GitHub Actions evidence. Strict TS/Vite/WebGL2 diagnostic scaffold, `package-lock.json` version 3, Node 22 workflow, npm scripts, and test harness are present.
- F0.02 — **NEXT**. GitHub Actions job passed on feature branch, but verify the merged `main` workflow before marking the milestone complete.
- Following task: F0.03 deterministic PRNG and balance schema.
- Latest implemented product: browser WebGL2 capability diagnostic screen, **not a playable game**.
- Host / preview URL: NONE configured. Visual or runtime browser QA: NOT performed.
- All remaining F0–F8 game/engine tasks: not yet implemented.

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
3. Finish F0.02 only after green main GitHub Actions evidence; then proceed to F0.03.
4. Preserve strict truthfulness: do not claim deployment, playable graphics, or end-to-end browser interaction yet.
