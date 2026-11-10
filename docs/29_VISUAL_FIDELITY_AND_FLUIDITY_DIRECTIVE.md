# Bastionfall — Visual Fidelity, Fluidity & Production Quality Directive (VQ.2026-11-10)

**Status:** binding user mandate for every new session. **VQ.01 is now implemented and verified; next VQ.02** original authored environment assets. [Actual screenshot/CI review](30_VQ01_NATIVE_DPI_BROWSER_REVIEW.md). This directive's quality gates remain mandatory.
**Scope:** all shipped gameplay, art, tools, screenshots, performance work, and repository planning.  
**Authority:** supplements the studio-wide [master production directive](00_MASTER_PRODUCTION_DIRECTIVE.md), sharpens the [illustrated 3D art north star](20_VISUAL_NORTH_STAR.md), and overrides older conflicting low-fidelity/procedural-only constraints. The game design bible governs gameplay rules; this document governs presentation quality, delivery evidence, and sequencing. Historical postmortems remain intact as evidence, not active instructions.

## 0. Product standard: highest *achievable* polished result, not the easiest LLM-created prototype

Produce an **original, characterful, readable, tactile, fully three-dimensional fantasy tower-defense game** with the playful graphic clarity and expressive motion broadly associated with *Kingdom Rush*, but with **distinct Bastionfall-owned identities, environment, UI, world, and animation**. Reject both (a) glossy, realistic, tiny-army *Rise of Kingdoms*-style promotional graphics and (b) blurry, sparse, low-resolution primitive demonstrations. External game art and screenshots are **reference material only**, never licensed assets.

**Quality is not an optional final polish phase.** Each gameplay iteration must improve or preserve the quality of the *actual playable runtime*. Passing TypeScript, a smoke test, or rendering a colorful frame is **not** a visual acceptance result. A pleasing concept mockup is **not** evidence of in-engine improvement.

Do not let hand-coded primitive mesh limits dictate art quality. Use source-pinned, properly licensed, coherent artist-authored GLB/glTF, PBR/toon-compatible authored materials, real skeletal clips, curated palettes, deliberate staging, animation, and suitable free professional tools. Procedural construction remains useful for terrain, placement, collisions, and deliberate background structures; it is **not an acceptable default ceiling** for focal characters, keep, towers, major foliage, or foreground props.

**Non-negotiable tradeoff:** maximize fidelity *subject to* measured device performance, usability, licensing, maintainability, and working gameplay. Never trade away visual quality solely for hypothetical performance; never ship unusable mobile performance merely to show off an effect.

## 1. Current implementation reality — correct the documented misconceptions

- The primary 3D scene is already rendered by **Three.js r184 / WebGL2**, with deterministic TypeScript game simulation and an explicit legacy diagnostic fallback. Do **not** restart an engine migration or describe Three.js as prohibited. Do not switch to Babylon/Unity/Godot without actual repository-specific evidence of meaningful advantage. WebGPU is optional and must retain a tested WebGL2 path.
- **Historical VQ.01 gap now closed:** movement previously fixed at 1280×720 (720×1280 portrait). Actual active Three Warden scene now renders responsive CSS × DPR × bounded tier resolution; verified browser results in [VQ.01 review](30_VQ01_NATIVE_DPI_BROWSER_REVIEW.md). Legacy/cinematic paths retain separate fixed-resolution diagnostic behavior.
- The Three renderer intentionally retains `setPixelRatio(1)` because its canvas backing dimensions are already **physical pixels**. VQ.01 now calculates CSS × DPR × quality budget separately and passes the physical output to Three without double application; this is verified, not an unresolved problem.
- `CanvasRuntime.computeCanvasResolution` is now integrated in the actual Three gameplay Warden preview (VQ.01) with GPU-safe `resizeBackbuffer`, quality settings, and real Chrome physical-buffer verification. [Evidence](30_VQ01_NATIVE_DPI_BROWSER_REVIEW.md).
- A 4K frame of rudimentary models is still rudimentary. Resolution, edge quality, art fidelity, motion, and composition have **distinct acceptance tests**.
- Existing ART.03b licensed CC0 rigged characters and 140ms visual transitions are useful foundations, **not final exclusive Bastionfall art**. Environment/keep/pads/HUD remain far behind the goal. Do not claim new assets or effect passes are integrated until the running game proves them.

## 2. Enforced parallel tracks, ordered by actual visual impact

Track **P — presentation** is always active, in parallel with Track **G — game completion**. At each bounded iteration prioritize the largest visible deficiency or broken gameplay dependency. No prolonged documentation-only loops.

### P0 — sharp, responsive native-density rendering (implemented and verified as VQ.01; acceptance standards retained)
1. Measure the live gameplay canvas CSS dimensions with `getBoundingClientRect` / `ResizeObserver`, get `window.devicePixelRatio`, and use the existing resolution utility to choose physical backbuffer dimensions. Recompute on orientation, window resize, layout and DPR changes as appropriate. Keep aspect and camera projections consistent. Expose a truthful quality tier and backbuffer/CSS size for debugging.
2. Implement **economy / balanced / sharp** device-aware modes and a sensible bounded pixel budget. On high-end desktop support high-DPI **when hardware permits**; on mobile keep a controllable fallback and protect FPS/battery/memory. Make the viewport truly responsive; avoid a CSS-upscaled low-resolution framebuffer.
3. Because Three.js currently initializes with an already-size-controlled canvas, use **one** contract: either `renderer.setPixelRatio(1)` + `renderer.setSize(backingWidth,backingHeight,false)`, or CSS size + DPR, **not both**. Check actual `renderer.getDrawingBufferSize` and WebGL drawing-buffer dimensions. Handle actual renderer resizing without creating extra contexts. Verify no stretched or cropped frame.
4. Distinguish CSS pointer coordinates from physical backbuffer pixels. Revalidate tower-pad clicking, camera pick rays, Warden controls, overlay label projection, pause, and movement in both orientations. Keep camera math in correct units.
5. Maintain pixel-art-free, readable UI using CSS/retina-safe assets; never blur or scale the whole screenshot as a substitute for resolution. Preserve screenshot reproducibility via an explicit deterministic capture preset if needed.
6. Inspect screenshot pairs at **actual displayed size** and at **100% crops** on landscape, portrait, standard-DPR and high-DPR viewports. Write down actual tested viewport/CSS size/backbuffer/DPR/quality values. Add tests and a real-browser probe that asserts backing dimensions exceed CSS dimensions when appropriate, under the safe pixel cap.
7. Keep MSAA or another validated edge solution; test for shimmering/jagged geometry and texture aliasing under camera movement. Do not indiscriminately pile SMAA/FXAA/TAA onto MSAA: measure improvement vs softness, ghosting, GPU cost, compatibility, and input responsiveness.

**P0 done means:** sharpness changes are *visible in the actual Three gameplay scene*, responsive dimensions are demonstrated by probes/screenshots and not merely math-unit tests, no regressions in gameplay/selection, and both modes have performance caveats honestly documented. No claim of 4K or native-density capability without a verified matching buffer.

### P1 — coherent original high-fidelity 3D asset production
- Replace the most eye-catching weak **keep, tower pads, trees/foliage, road banks, bridges and character silhouette elements** one coherent *in-game* asset family at a time. Preserve geometry scale, collision/route exclusions, faction readability and camera composition.
- Curate real stylized GLB meshes with documented source URL, license and exact revision/hash; preserve UVs, authored textures, normals, pivots, materials, skinning and native clips. Use `glTF-Transform`, Meshopt, and KTX2 selectively when exact pipeline compatibility and appearance are measured. Do not ship an arbitrary mismatched assortment of free models or use external art without reuse rights.
- Prefer painterly color ramps, chunky sculptural masses, controlled material roughness, softened contact areas, purposeful surface detail and readable silhouettes. No toy cones, blank gray hexagonal pads, flat green slab, or overly photoreal texture noise as accepted end states.
- Each asset must improve a recorded 16:9 + 9:16 screenshot at gameplay zoom, not only appear nicer in a model viewer. Keep before/after images, source manifest, attribution and an honest critique.

### P2 — graphics direction, lighting and render finish
- Use accurate sRGB/linear color handling, restrained tone mapping, authored lighting hierarchy, warm/cool broad light masses, stable directional and **contact** shadows, and readable depth separation.
- Evaluate painterly/toon ramps, selective silhouette outlining, AO/contact treatment, color grading and **careful** postprocessing. Optional `pmndrs/postprocessing` is a candidate, **not installed by decree**. Choose Three-native compatible passes where more appropriate. Avoid broad bloom, aggressive DOF, film grain, heavy TAA ghosting or any deliberately soft effect that masks low geometry detail.
- Validate material quality, shadow stability, dark-detail readability, reflections/specular, and aliasing in motion at the *actual gameplay camera*. Keep WebGL2 supported; WebGPU-only paths require independent compatibility testing and graceful fallback.

### P3 — premium character animation and game feel
- Improve authored skeletal Idle/Walk/Run/Attack/Hit/Death with gait, foot plants, weight shift, differentiated timing, anticipation, recoil, follow-through, recovery and non-lockstep enemy movement. Preserve deterministic gameplay logic; purely visual interpolation/blending must not alter damage/position truth.
- Time convincing projectile release to attack pose, visibly connect impact VFX with collision, add purposeful hit response, camera/hud feedback and brief restrained particles. Reduce foot sliding, static weapon attachment, snapping/teleports, clipped animations and abrupt camera motion.
- Inspect actual **motion clips/sequences**, not one still image; test 30/60 FPS behavior, differing elapsed frame intervals, paused/recovered tabs, and reduced-motion accessibility. Current 140ms crossfade is a starting point, not a universal answer.

### P4 — integrated mobile and desktop UX
- Replace engineering HUD and temporary screen shells with a consistent illustrated, legible and responsive game UI. Preserve readable lane/pad choices, safe areas, touch hit regions, interaction affordances and color-blind differentiation.
- Establish defined desktop and midrange mobile reference configurations; **aim** for smooth 60 FPS desktop and at least playable 30 FPS mobile, but report measurements rather than guarantees. Track rAF p50/p95 separately from CPU submit and real GPU timing; SwiftShader screenshots are not a real mobile FPS test.
- Control download size, texture memory, animation/draw-call overhead, shadow quality, instancing/culling/LOD and frame spikes. Performance changes must avoid silent visual downgrade.

### G — never abandon the actual game
Continue F3.04 crown rewards/economy, purchasing and upgrades, attack/counterattack, wave progression, victory/loss, meaningful mobile input and saves according to the game design bible. **Do not accept only pretty demos as delivery**; never postpone the playable loop indefinitely for visual polish. Visual improvements must coexist with functioning deterministic simulation.

## 3. Mandatory visual QA contract and evidence

Every completed visible milestone requires:
- **Before/after** actual runtime screenshots with camera, time, seed, viewport, CSS size, DPR, physical render size, graphics tier and Git commit recorded. At least 16:9 landscape and 9:16 portrait; include a HiDPI comparison for P0 and moving footage/frame sequences for animation milestones.
- **Critical art review** explicitly assessing resolution/edge crispness, geometry, material treatment, light/shadow/contact, character silhouette, staging, gameplay readability, UI and motion. Identify remaining faults; visual checkmarks require actual inspected evidence.
- **Code gates**: repeatable clean install, TS, automated tests, build, asset/license hashes when relevant, real-browser WebGL initialization, pointer/gameplay regressions and absence of console errors. Attach/cite CI run + screenshot artifact for the exact commit. A green CI is **not** a passing artistic gate.
- **Performance honesty**: real Chrome software viewport tests demonstrate function but not device thermals, FPS, GPU timing or touch hardware. Differentiate `target`, `measured`, `not tested`; never invent benchmark numbers.
- **Source legality**: original Bastionfall look and independent character/asset identity. Do not commit reference-game captures, scraped art, unverified AI copies, or claims that generated concept boards are already rendered game assets.

A screenshot can pass technical correctness while failing appearance. In that case mark the **technical subtask done** and keep the **visual quality task open**. Avoid declaring artistic parity with third-party games or advertising a finished game prematurely.

## 4. Rules for every new ChatGPT development instance

1. Read in order: `AGENTS.md`, this directive, `docs/20_VISUAL_NORTH_STAR.md`, `docs/00_MASTER_PRODUCTION_DIRECTIVE.md`, `docs/06_EXECUTION_BACKLOG.md`, `docs/07_SESSION_STATE.md`, then relevant current code, art bible, visual reference index and reviews. **GitHub main is canonical**; never rely on previous chat context.
2. Audit the *latest* code before planning; do not trust historical statements as current status. Verify the runtime engine, actual graphics settings, source-pinned assets, latest merged milestone and pending PRs.
3. Identify one bounded highest-impact issue, propose measurable artistic and engineering acceptance, and **implement code + tests** (except an explicitly requested documentation alignment turn such as this one).
4. Commit via appropriate connected GitHub tools, verify the exact commit and actual CI/screenshot output, then update backlog/session log. Never report a test or GPU measurement not run.
5. If tools cannot produce actual screenshots, log the gap explicitly and retain the visual task open; do not quietly relabel screenshots from past commits.
6. Preserve user intent across new instances: **best possible original 3D cartoon graphical richness, sharpness, professional fluidity and motion, without legal/performance/functional shortcuts**. A passing test without this is not the end state.

### Source-of-truth precedence
1. New explicit user decisions, including original illustrated 3D over previously advertised realistic/mobile-strategy look.
2. This VQ directive for **quality policy, immediate rendering/asset/motion priorities and acceptance gates**.
3. `docs/20_VISUAL_NORTH_STAR.md` for **specific visual taste**; `docs/02_GAME_DESIGN_BIBLE.md` for game rules.
4. `docs/00_MASTER_PRODUCTION_DIRECTIVE.md` for full studio mission and general execution standards.
5. Current implementation/code, latest verified decisions and backlog/session state for **what is actually built**.
6. Historical initial constraints, old pipeline plans and postmortems are evidence only; conflicting primitive-only / no-Three.js / muted-style statements are **superseded**.

## 5. Open-source candidates — evaluate, don't cargo-cult

- Responsive sizing: existing `src/engine/render/CanvasRuntime.ts` + [Three.js responsive guidance](https://threejs.org/manual/en/responsive.html).
- Additional antialiasing/post: [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing), where supported, with before/after proof of benefit and measured softness/cost.
- Material reference: [Khronos glTF Sample Viewer](https://github.com/KhronosGroup/glTF-Sample-Viewer), useful for material rendering checks, not a mandatory runtime dependency.
- Asset validation/optimization: [glTF-Transform](https://github.com/donmccurdy/glTF-Transform), Meshopt and KTX2 after art-preserving verification.
- Existing Three.js plus authored GLB/skinned characters remain the default. Any engine change needs a scoped ADR demonstrating better *actual* runtime results.

## 6. Immediate next handoff

**VQ.01 native-DPI Three gameplay is VERIFIED** by [CI #42888985727](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42888985727) and [actual screenshot review](30_VQ01_NATIVE_DPI_BROWSER_REVIEW.md). **NEXT VQ.02** original sculpted/textured keep and build-pad architectural kit with verified legal provenance, genuine in-game integration, 16:9/9:16 before-after screenshots and art critique; F3.04 playable economy continues. Do not repeat VQ.01 or accept primitive high-DPI graphics as finished.

**This directive changes requirements and plans, not the game binary itself.** Do not claim P0/P1/P2/P3 are implemented merely because this document is committed.
