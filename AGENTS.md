# Bastionfall — mandatory development protocol

Read in this order at start of **every** conversation turn:
1. `AGENTS.md`
2. `docs/02_GAME_DESIGN_BIBLE.md`
3. `docs/03_ART_AND_ANIMATION_BIBLE.md`
4. `docs/05_ARCHITECTURE.md`
5. `docs/06_EXECUTION_BACKLOG.md`
6. `docs/04_OPEN_SOURCE_COMPONENTS.md` when adding dependencies
7. `docs/07_SESSION_STATE.md`

## Standing operating instruction
You are implementing the original browser game **Bastionfall**, based on the *advertised defense fantasy*, not copying Kingshot. Game runs on a purpose-built 3D WebGL2 engine written in strict TypeScript; use small permissive upstream libraries at explicit interfaces, not a bundled full game engine.

On each new user turn, read current code and state from the **connected GitHub repository** `lordfireballzmc/BrowserGame`. Treat GitHub as canonical, not conversation scrollback or claims from earlier replies. Pick **only the first uncompleted task whose dependencies are satisfied**, scoped to a single small cohesive improvement. If a prior task has code but lacks verified tests, attempt verification first. Never rewrite whole source files blindly without fetching the current latest version and checking SHA.

Before editing: identify relevant files, current status, tests and exact upstream docs if integrating a dependency. Document what the implementation will do and how to test it in concise internal task notes. Then implement through GitHub connector, commit to feature branch or main according to permissions, run whatever testing is actually available, and update the backlog/session state with truthful verification notes.

## Critical honesty constraints
A GitHub commit is not a passing build; WebGL screenshots cannot be inferred from code; a referenced repo is not an integrated dependency; a claimed deployed URL requires HTTP check; a model's opinion of rendering quality is not a screenshot review. Never invent tests, CI status, benchmarks, screenshot evidence, browser access, deployed URLs or code execution. If code runner is unavailable in this chat, make the minimal commit and leave 'verification pending'. Mark checklist [x] only when verifiable acceptance evidence exists.

## Single-turn budget
- One task or one related 2–3 subtasks maximum.
- Prefer 1–5 source files per turn; no giant one-shot AI-generated engine.
- Cross-check imports, types and function signatures against upstream verified usage and pinned release.
- Add tests in the same commit when possible; no disabled tests just to get green.
- Commit and report SHA, precise file paths, tests run/not run, next backlog task.
- Update `docs/07_SESSION_STATE.md` at end of each successful editing turn. This is **the memory across chats**.
- Never mark more than one F-task complete without independent proof.
- Maintain consistent 3D assets, semantic color tokens, camera and animation rules. No arbitrary neon shapes or asset placeholders disguised as production graphics.

## Stop conditions
Stop and ask for user decision if:
- specification ambiguity could change core gameplay or art identity;
- a new proprietary SDK, nonpermissive license, third-party server, expense, secret/token or public production release would be needed;
- GitHub cannot be reached, repository is ambiguous, or a commit fails twice;
- CI is red and diagnosis is nontrivial;
- the requested action could overwrite somebody else's work;
- more than two successive turns cannot make provable progress.
Do not circumvent chat restrictions, rate limits, tool approvals or browser workflows.

## Final response format
**TASK** <ID> | **COMMIT** <SHA or none> | **IMPLEMENTED** paths+behavior | **VERIFICATION** evidence or pending | **NEXT** <ID> | **STOP** one short line. No unnecessary re-explanation of the whole project.

## External extension
The optional user-installed browser extension is outside this codebase. This document defines what a **manually or otherwise authorized new chat turn** should request, not a guarantee that background auto-submission is permitted or reliable.
