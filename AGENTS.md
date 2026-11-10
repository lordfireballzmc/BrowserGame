# Bastionfall — mandatory development protocol

Read at the start of every authorized development turn, using **latest GitHub** state:
1. `AGENTS.md`
2. **`docs/29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md` — binding fidelity, sharpness, motion, and visual-QA requirements**
3. `docs/20_VISUAL_NORTH_STAR.md` — authoritative original illustrated 3D aesthetic
4. `docs/00_MASTER_PRODUCTION_DIRECTIVE.md` — full studio mission
5. `docs/02_GAME_DESIGN_BIBLE.md` — gameplay mechanics
6. `docs/06_EXECUTION_BACKLOG.md` — current priorities and acceptance gates
7. `docs/07_SESSION_STATE.md` — accurate cross-chat handoff
8. `docs/03_ART_AND_ANIMATION_BIBLE.md` and `docs/visual-references/README.md`
9. `docs/05_ARCHITECTURE.md`, `docs/23_ASSET_FIRST_THREE_MIGRATION_ADR.md`
10. `docs/21_VISUAL_REVIEW_HISTORY.md` and actual screenshot reviews
11. `docs/04_OPEN_SOURCE_COMPONENTS.md` when adding packages

## Standing operating instruction
You are implementing the original browser game **Bastionfall**, based on the *advertised defense fantasy*, not copying Kingshot. The primary gameplay scene **already uses Three.js r184/WebGL2** with coherent source-pinned GLB skinned actors, plus preserved deterministic strict-TypeScript simulation. A legacy custom renderer remains for diagnostics/regression. Do not restart the old engine debate; pursue sharper physical resolution, original premium 3D assets and animated fluidity under the binding VQ directive while protecting real gameplay. An externally authored mesh is preferable to primitive-only focal art when legally sourced and visually coherent.

On each new user turn, read current code and state from the **connected GitHub repository** `lordfireballzmc/BrowserGame`. Treat GitHub as canonical, not conversation scrollback or claims from earlier replies. Choose the highest-impact feasible bounded gameplay or **visual production-pipeline** milestone, with direct source and test evidence. Keep existing work running while migrating, and avoid documentation-only stalling. If a prior task has code but lacks verified tests, attempt verification first. Never rewrite whole source files blindly without fetching the current latest version and checking SHA.

Before editing: identify relevant files, current status, tests and exact upstream docs if integrating a dependency. Document what the implementation will do and how to test it in concise internal task notes. Then implement through GitHub connector, commit to feature branch or main according to permissions, run whatever testing is actually available, and update the backlog/session state with truthful verification notes.

## Priority and conflicts
**Precedence:** latest explicit user decision, VQ fidelity/motion directive for production quality, visual north star for original art style, gameplay bible for rules, master directive for general engineering. Historical custom-renderer/primitive-only constraints are superseded, not mandates. New sessions must not treat a concept mockup, CI success or a fixed 720p framebuffer as proof of attractive graphics.

The **latest binding VQ directive** in `docs/29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md` sets real native-resolution, authored-asset, motion and visual-evidence gates; `docs/20_VISUAL_NORTH_STAR.md` sets the original illustrated-3D taste; `docs/00_MASTER_PRODUCTION_DIRECTIVE.md` sets general studio production standards. Together they supersede outdated restrictions forbidding Three.js, textured professional art, PBR or suitable postprocessing, and reject low-res, toy-primitive or glossy strategy-advertisement aesthetics. **Retain** working deterministic simulation, legal provenance, measured performance, no paid services and real verification. ADR-023 documents the historic bounded dual-renderer pilot, which is **already deleted**; current Three.js world/render scenes are unified and remaining legacy diagnostics are temporary. New chats must implement verifiable code improvements rather than restart engine debates.

## CURRENT DEPLOYMENT BLOCKER — SITE.01
PR #30 is merged, and production browser tests + upload passed [Actions #42894651796](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42894651796); **GitHub Pages publication is NOT YET LIVE**. GitHub's `configure-pages@v5` failed `Get Pages site failed: Not Found`. The repository owner needs [Settings → Pages → Source: GitHub Actions](https://github.com/lordfireballzmc/BrowserGame/settings/pages) with a private-Pages eligible plan (GitHub Pro/Team/Enterprise); see [deployment runbook](docs/31_PERMANENT_PLAYABLE_SITE.md). Do not claim the `github.io` URL works until deploy and HTTP verification. Source must remain private unless the user explicitly approves visibility change.

## Immediate handoff — VQ.02b source-pinned KayKit forest verified; VQ.02c + F3.04 NEXT
**VQ.01 and VQ.02a remain verified. VQ.02b is now merged and exact-head browser verified:** [PR #32](https://github.com/lordfireballzmc/BrowserGame/pull/32), [CI #42919159127](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42919159127) (**199 tests/25 files**, landscape/portrait actual game A/B, DPR2, 19-raider combat and pad selection), [real screenshot critique](docs/33_VQ02B_KAYKIT_FOREST_ART_REVIEW.md). The initial simpler Kenney foliage candidate was **rejected on image review** and replaced *before merge* with ONE **396KB CC0 KayKit Forest Nature GLB** by Kay Lousberg: seven artist mesh silhouettes sharing one atlas, 40 trees+42 rocks instanced in **seven GPU groups** at the pre-existing deterministic scenery sites. **NEXT: VQ.02c organic source-pinned boulders and original painterly ground/road edge/foliage framing**: current rocks read like mechanical stacked rings, flat grass and diagnostic HUD fail final-quality gate. Advance **F3.04 crown rewards/tower purchase economy** in parallel. SITE.01 GitHub Pages is not live without owner configuration. Never redo VQ.01/VQ.02a/VQ.02b or claim source art is exclusive.

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
**TASK** <ID> | **COMMIT** <SHA or none> | **IMPLEMENTED** paths+behavior | **VISUAL IMPROVEMENT** real evidence or NONE | **VERIFICATION** exact CI/perf/screenshot evidence or pending | **REMAINING DEFICIENCIES** | **NEXT** <ID> | **STOP** one short line. No unnecessary re-explanation of the whole project.

## External extension
The optional user-installed browser extension is outside this codebase. This document defines what a **manually or otherwise authorized new chat turn** should request, not a guarantee that background auto-submission is permitted or reliable.
