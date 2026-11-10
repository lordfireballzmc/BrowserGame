# Bastionfall — mandatory development protocol

Read in this order at start of **every** conversation turn:
1. `AGENTS.md`
2. **`docs/00_MASTER_PRODUCTION_DIRECTIVE.md` (user-supplied binding studio mission; overrides outdated technical ceilings)**
3. `docs/02_GAME_DESIGN_BIBLE.md`
4. **`docs/20_VISUAL_NORTH_STAR.md` (most recent user-approved art direction)**
5. `docs/visual-references/README.md` (original in-repo SVG and visual evidence)
6. `docs/03_ART_AND_ANIMATION_BIBLE.md`
7. `docs/05_ARCHITECTURE.md`
8. `docs/23_ASSET_FIRST_THREE_MIGRATION_ADR.md` for rendering/asset tasks
9. `docs/06_EXECUTION_BACKLOG.md`
10. `docs/04_OPEN_SOURCE_COMPONENTS.md` when adding dependencies
11. `docs/21_VISUAL_REVIEW_HISTORY.md` for any visible task
12. `docs/07_SESSION_STATE.md`

## Standing operating instruction
You are implementing the original browser game **Bastionfall**, based on the *advertised defense fantasy*, not copying Kingshot. Game currently runs on a purpose-built 3D WebGL2 engine in strict TypeScript, but the user's binding directive authorizes a **measured migration to Three.js**, vetted GLB assets, PBR materials and skeletal animation. Treat legacy render architecture as temporary; preserve deterministic TypeScript simulation and the 3D cartoon identity. An externally authored mesh is preferable to primitive-only focal art when legally sourced and visually coherent.

On each new user turn, read current code and state from the **connected GitHub repository** `lordfireballzmc/BrowserGame`. Treat GitHub as canonical, not conversation scrollback or claims from earlier replies. Choose the highest-impact feasible bounded gameplay or **visual production-pipeline** milestone, with direct source and test evidence. Keep existing work running while migrating, and avoid documentation-only stalling. If a prior task has code but lacks verified tests, attempt verification first. Never rewrite whole source files blindly without fetching the current latest version and checking SHA.

Before editing: identify relevant files, current status, tests and exact upstream docs if integrating a dependency. Document what the implementation will do and how to test it in concise internal task notes. Then implement through GitHub connector, commit to feature branch or main according to permissions, run whatever testing is actually available, and update the backlog/session state with truthful verification notes.

## Priority and conflicts
The complete user-approved master directive lives in `docs/00_MASTER_PRODUCTION_DIRECTIVE.md`, and the illustration-first visual north star in `docs/20_VISUAL_NORTH_STAR.md`. Together they supersede outdated rules forbidding Three.js, imported focal art, PBR, textures, professional asset tools or suitable postprocessing. **Do not** supersede working simulation, legal provenance, performance safeguards, no paid services, or real verification. `docs/23_ASSET_FIRST_THREE_MIGRATION_ADR.md` limits the initial dual-renderer GLB proof to one temporary pilot; no parallel renderer as a final architecture. Every subsequent new chat should continue actual code improvements, not re-argue the decision.

## Critical honesty constraints
A GitHub commit is not a passing build; WebGL screenshots cannot be inferred from code; a referenced repo is not an integrated dependency; a claimed deployed URL requires HTTP check; a model's opinion of rendering quality is not a screenshot review. Never invent tests, CI status, benchmarks, screenshot evidence, browser access, deployed URLs or code execution. If code runner is unavailable in this chat, make the minimal commit and leave 'verification pending'. Mark checklist [x] only when verifiable acceptance evidence exists.

## Single-turn budget
- One task or one related 2–3 subtasks maximum.
- Keep changes scoped and reviewable, but permit a complete asset pipeline, dependency lock and real browser integration in the same vertical-slice milestone. No giant one-shot rewrite.
- Cross-check imports, types and function signatures against upstream verified usage and pinned release.
- Add tests in the same commit when possible; no disabled tests just to get green.
- Commit and report SHA, precise file paths, tests run/not run, next backlog task.
- Update `docs/07_SESSION_STATE.md` at end of each successful editing turn. This is **the memory across chats**.
- Never mark more than one F-task complete without independent proof.
- Maintain consistent 3D assets, semantic color tokens, camera and animation rules. **Use professionally authored, properly licensed external GLB/glTF assets for important visible objects**; primitive generators remain valid for terrain/collision/debugging. Maintain source URLs, revision pins, exact checksums and license manifests. No arbitrary neon placeholders disguised as production graphics.

## Professional art and motion quality gate (standing instruction)
For each task that adds or changes anything visible, treat *game feel and presentation*
as acceptance criteria, not a separate cosmetic afterthought. Preserve the original
miniature art direction while improving readable silhouettes, geometry, grounding,
sun/contact shadows, color hierarchy, lighting, and UI layout at gameplay zoom.
Prefer genuine 3D motion with stable simulation clocks; do not mistake moving an
entire rigid mesh for a completed articulated run/fire animation.

Before marking a visible task complete, run real WebGL2 browser checks and inspect
both landscape and portrait captures for camera framing, clipping, depth,
unintended empty areas, legibility and focus. Record what still looks unfinished,
using the **new user-selected illustrated, playful, chunky 3D cartoon** target
in `docs/20_VISUAL_NORTH_STAR.md`, never reproducing third-party art. The user
explicitly rejected a Rise-of-Kingdoms-like glossy realistic aesthetic and
prefers the readable personality and movement energy generally associated with
Kingdom Rush, translated into **original fully three-dimensional content**. Test controls, pause, collision and performance honestly:
CPU-submit timing isn't GPU frame time; a Chrome software render is not mobile
hardware testing. Never claim a studio-quality polish gate without evidence.
Keep graphics and interaction regressions covered as gameplay systems expand.

## Persistent art-direction decision (2026-11-10)
**Non-negotiable:** our original game should look like a polished illustrated
storybook tower-defense world **in 3D**: rounded/chunky readable architecture,
expressive Warden/raider silhouettes, bold friendly color ramps and purpose-built
animations. **NOT** photorealistic or ornate Rise-of-Kingdoms style, and
**NOT** merely flat unshaded low-poly engineering graphics. Consult the
version-controlled `docs/visual-references/target-illustrated-3d-composition.svg`
and art direction README before any character, environment, shader, animation,
UI or camera work. Do not mistake AI mockups/illustrations for implemented
WebGL2 graphics; no direct copying of Kingdom Rush or Kingshot art/assets.
When a requested development continuation would otherwise prioritize another
implementation task, preserve this target as a binding quality gate.

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
