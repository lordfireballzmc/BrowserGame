# Execution backlog — machine-readable human-readable source of truth

**LATEST VERIFIED HANDOFF — 2026-11-11:** VQ.01, VQ.02a, VQ.02b, VQ.02c and **VQ.02d are MERGED / real-browser verified**. [PR #34](https://github.com/lordfireballzmc/BrowserGame/pull/34) squash `ed03193f444d1bea25513a0c2b11e0e68cd20d81`; [exact-head full CI #42926944486](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42926944486) passed **207 Vitest tests / 27 files**, typecheck/build, real Chrome Warden/19-raider bolt combat, P01 selectable/P09 locked, landscape/portrait 3D undergrowth A/B, DPR2 and the older visual regressions. [Compiled production-site browser #42926944439](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42926944439) passed. 736 artist-authored KayKit grass instances + 48 bushes + 120 Kenney 3D CC0 flowers = **904 visual-only source models in seven GPU instanced batches (421,728 source triangles)**; all 258 original scenery sites and road/pad/gameplay collision unchanged; original visual fallback retained. [Persistent actual-screenshot critique](35_VQ02D_ILLUSTRATED_GROUNDCOVER_REVIEW.md). **NEXT: F3.04 real kill crowns, towers and waves; VQ.02e distinctive terrain/keep and portrait staging; VQ.03 polished materials/light; VQ.04 fluid animation; VQ.05 illustrated HUD.** Overall professional original game art, user signoff, real mobile FPS and public Pages deployment NOT established. Older handoffs below are historical, not next-task instructions.

Every task has ID; [ ] pending, [~] partial, [x] technically verified. **VQ.01 and VQ.02a/b/c/d scoped art slices are verified but the overall VQ.02 professional-art gate remains OPEN.** Do **F3.04 actual kill rewards, purchasable towers, enemy counterattacks and real waves**, while continuing VQ.02e distinctive scene silhouettes, VQ.03 light/material design and VQ.04 expressive skeletal attacks; VQ.05 illustrated HUD and real mobile GPU metrics remain undone.

## VQ — mandatory high-fidelity / fluidity production track (latest user mandate)

**Binding authority:** [VQ production directive](29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md) and [original illustrated 3D art north star](20_VISUAL_NORTH_STAR.md). Track VQ (visual-quality implementation) stays active **alongside the real playable-game track F3.04**. Art style: original chunky painterly fantasy-defense personality and expressive motion, **not** glossy Rise-of-Kingdoms realism or bare primitive/low-res demonstrations. A documentation commit is not a visual improvement. Each checked task needs both technical tests and actual inspected in-engine evidence.

- [x] **VQ.01 — completed native-DPI / quality-tier / responsive Three gameplay.** PR #29 squash merged `8c72c55bcde9780388403a3184d700d043a88c22`. [CI #42888985727](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42888985727): 193 tests / 23 files, typecheck, build, real Chrome Warden/19 raiders/physical bolts, DPR2 Sharp physical 2400×1350 landscape and 1350×2400 portrait, quality select + live viewport roundtrip passed, legacy map pad/cinematic regressions. [Actual PNGs and critical review](30_VQ01_NATIVE_DPI_BROWSER_REVIEW.md). Real phone FPS and polished art still unverified.
- [~] **VQ.02 — original illustrated 3D art direction still NOT FINAL.** VQ.02a CC0 keep+10 pads [review](32_VQ02A_KENNEY_CASTLE_ART_REVIEW.md), VQ.02b KayKit forest trees [review](33_VQ02B_KAYKIT_FOREST_ART_REVIEW.md), VQ.02c smooth meadow/organic stones [review](34_VQ02C_MEADOW_AND_ORGANIC_STONE_REVIEW.md) are verified. **VQ.02d [x] technically VERIFIED:** [PR #34](https://github.com/lordfireballzmc/BrowserGame/pull/34) adds 736 sculpted grass, 48 bushes, 120 3D wildflowers = 904 source-licensed CC0 models, 7 GPU instanced groups and 421,728 source triangles, with original 258 F2.05 positions/roads/river/pads/19 raiders/bolts unchanged. Source flowers are exactly pinned Kenney solid-color-PBR glTF and grass/bush reuse existing KayKit forest atlas. [CI #42926944486](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42926944486) passes 207 tests/27 files, true 16:9+9:16 botanical before/after, DPR2, P01/P09 and battle; [production browser #42926944439](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42926944439) passes. [Actual screenshot critique](35_VQ02D_ILLUSTRATED_GROUNDCOVER_REVIEW.md). **NEXT VQ.02e** unique keep/terrain/road character, portrait framing and stronger sculpting; **F3.04** real crown/tower economy and waves highest-value gameplay milestone. NOT user-approved art or real phone GPU FPS.
- [ ] **VQ.03 — deliberate material, lighting, AA and tasteful postprocessing.** Review Three-native toon/PBR response, tone mapping, contact/cast shadowing, painterly color ramps and edge quality; evaluate optional postprocessing/SMAA against existing MSAA without blurring or ghosting. **Gate:** actual gameplay screenshot pairs and motion aliasing check, mobile budget when hardware available, full functional fallback and measured overhead.
- [ ] **VQ.04 — fluid skeletal animation and compelling game feel.** Improve real 3D gait/foot grounding, non-lockstep cadence, attack/recoil anticipation and recovery, meaningful projectile and hit response, camera motion and restrained VFX. **Gate:** real animation sequence captures at representative 30/60 FPS conditions, true deterministic damage/physics unaffected, pause/visibility/reduced-motion tests and independent visual critique.
- [ ] **VQ.05 — illustrated responsive production UI and mobile experience.** Replace engineering-stage HUD and menus with crisp legible fantasy UI; safe areas, portrait/landscape hierarchy, touch/pad affordances, explicit graphics quality settings. **Gate:** real phone-like viewports, pointer/touch interactions, readable CSS-native-scale text, performance/fallback measurements or honestly pending.
- [ ] **VQ.06 — reproducible visual regression and art review pipeline.** Capture actual committed runtime at controlled seed/tick/camera, label viewport, CSS/render size, DPR, tier, commit and browser; preserve reviewed 16:9/9:16 side-by-side images, motion clips for animation milestones. **Gate:** real CI/browser artifacts and written positive/negative visual analysis, not concept art masquerading as shipped graphics.

**Ordering:** VQ.01/VQ.02a–d bounded technical acceptance complete; **NEXT F3.04 complete tower-defense economy**, while **VQ.02e + VQ.03/04** improve original expressive sculpting, lighting and real fluid animation, with explicit 16:9/9:16 screenshot/motion QA every iteration. Avoid idle documentation-only milestones and preserve legal source metadata.


## VISUAL-PIPELINE OVERRIDE — user-ordered production upgrade
- [x] **ART.01** Upgrade engineering environment from mandatory primitives to a **reproducible professionally authored, licensed, locally bundled textured GLB pipeline** with Three.js/WebGL2 in the **actual active Warden scene**, independent art/copyright provenance and photo/screenshot gate. Source pinned CC0 Lantern technical sample (NOT final game art); preserve the legacy simulation, prove model/texture/camera integration in desktop + portrait, and explicitly plan retirement of the temporary dual-WebGL2 bridge. Verified [PR CI 42822409551](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42822409551): 178 Vitest tests, strict TypeScript, production build, all original browser graphics/pad/combat regressions and actual imported textured GLB in both 16:9 and portrait Warden scenes. Real screenshots downloaded and reviewed, model visible but small; no commercial art parity. See `docs/00_MASTER_PRODUCTION_DIRECTIVE.md`, `docs/23_ASSET_FIRST_THREE_MIGRATION_ADR.md` and `docs/24_ART01_TEXTURED_GLTF_BROWSER_REVIEW.md`.
- [~] **ART.02** First concrete slice **ART.02a**: shared WebGL2 canvas/GLB/depth/shadow for actual 3D terrain, road, Warden/raiders, bolts, with original scene geometry converted to Three BufferGeometry and GPU InstancedMesh, retained tested camera/physics, and explicit legacy regression fallback. [CI #42824821031](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42824821031) passed 182 tests, TypeScript/build, old gameplay and unified real Chrome landscape/portrait screenshot probes. The two-canvas ImportedArtLayer is deleted; Warden movement defaults to unified Three. **ART.02b also verified:** default single Three scene for the full-island map, actual P01 selection and locked P09 rejection, plus both landscape/portrait cinematic compositions. [Chrome/CI #42832578697](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42832578697) passed 182 Vitest tests, TS/build, old renderer checks and 6 real CDP screenshots; reviewed artifact 13772835552. **Still incomplete:** dedicated gallery/diagnostic migration, removal of legacy renderer after equivalent feature acceptance, mobile performance budgeting and higher-quality authored art (ART.03). Art gap documented in `docs/25_ART02_SINGLE_SCENE_REVIEW.md` and `docs/26_ART02B_MAP_CINEMATIC_REVIEW.md`.
- [~] **ART.03** ART.03a has three real CC0 artist-authored **rigged and textured** mobile-trimmed 3D character GLBs (Knight/Warden, Barbarian/Scrapper, RogueHooded/Runner, 1.66 MB combined), five real clips per role and real Three SkeletonUtils/AnimationMixer poses in the same live 19-raider/bolt world; source Git SHA and optimized SHA256 documented; initial [Chrome run #42838208953](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42838208953) passed 187 tests and actual skinned actors in both orientations. First screenshots showed brown/green raiders and gray Warden; a simple tint also failed. **A shader post-atlas faction repaint passed actual Chrome landscape and portrait screenshots**, [exact-head run #42846937678](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42846937678): **188 tests**, 20 actual actors, 820 unique joints, 15 clips and game combat preserved. The factions are now legible blue/coral red but excessively monochromatic; gold trim, rich reds and character originality still need professional ART.03b. **ART.03b first authored-mesh identity pass technically accepted in real Chrome portrait and landscape (PR #27):** eight source mesh-part material groups per role, real hand-socket sword/shield/axe/crossbow instead of stacked variants, and 140ms deterministic bone-clip transition blending. First [CI #42850500809](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42850500809) passed 192 tests and actual desktop Chrome all views, but visual inspection found helmet overly gold and enemies brown; revised to blue-primary helmet + bright crimson headdress and **actual frame review confirmed success** in [CI #42852540671](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42852540671): **192 tests**, both crops, source exact screenshot artifact **13781018146**; source remains generic CC0 style and wider game is not visually finished. Detailed record `docs/28_ART03B_CHARACTER_IDENTITY_REVIEW.md`. **Still pending:** independent Bastionfall character identities, improved attack impact/foot planting, real mobile performance, ART.03c coherent keep/foliage/tower-pad assets, and F3.04 crowns. See `docs/27_ART03A_RIGGED_CHARACTERS_REVIEW.md`.
- [ ] **ART.04** Introduce skeletal state blending and follow-through, better stylized PBR/toon materials, controlled postprocessing, and measurable mobile graphics budgets. Never claim mockups or desktop software screenshots as mobile frame-rate evidence.

**Ordering:** This user-requested visual production track may advance in parallel with the next normal gameplay task **F3.04**. Do not falsely check off F3.04 merely for a rendering pilot.

## F0 — bootstrap (required before visual code)
- [x] **F0.01** Initialize Vite strict TS, package manager lockfile, Node version, scripts dev/build/typecheck/test; output `package.json, tsconfig.json, index.html`; gate install/typecheck/build.
- [x] **F0.02** CI GitHub Actions for typecheck/unit/build with caches, least privileges; gate documented green workflow.
- [x] **F0.03** deterministic PRNG + test vectors, balance data schema; gate same seed returns same numbers and no Math.random in state.
- [x] **F0.04** fixed-step Loop with pause/visibility handling, test fake clock; gate exact number of steps, cap catch-up, no async reentrant loops.
- [x] **F0.05** app state, splash, WebGL2 detector and fatal fallback; gate HTML loads; fails gracefully without context.
- [x] **F0.06** architecture ADR docs updated for actual pinned dependency versions, attribution.

## F1 — graphics engine
- [x] **F1.01** shader compile/error reporting, GPU resource manager, context loss, cleanup; gate no leaked buffers on reset.
- [x] **F1.02** gl-matrix ortho camera / world-screen projection and following; gate corner/unit tests for aspect ratios.
- [x] **F1.03** geometry core: bevel box, faceted cylinder, pyramid/wedge, low-poly ellipsoid, planar ribbon, disks; vertex/index/normal validation.
- [x] **F1.04** instanced renderer with static buffers, material palette, gamma treatment, depth/cull/blend passes; gate 500 instances benchmark trace.
- [x] **F1.05** canvas resize/render-resolution controls, viewport portrait, error overlay, render metrics.
- [x] **F1.06** initial *artistically intentional* hero, 2 enemy archetypes and core; compare actual browser screenshot against art bible.

## F2 — coherent procedural world
- [x] **F2.01** 72×48m deterministic heightfield mesh tiles with seam equality tests, clipped island rim and rock stratum.
- [x] **F2.02** authored spline road / road quad strip with consistent width; visual and collision lane checks.
- [x] **F2.03** build pad octagonal mesh, screen projection price tag, interaction region, 10 authored coordinates.
- [x] **F2.04** riverbank and cliff low-poly geometry, consistent palette, no water texture or visual fog.
- [x] **F2.05** seed-based grass/tree/rock/flower distribution with no-build zones, Poisson strategy and caching.
- [x] **F2.06** lighting/contact-shadow flat material treatment; screenshot composition 1080p and 9:16. CI 42778571669 (149 tests, typecheck, build, real WebGL2 16:9/9:16 frames) and actual screenshot inspection documented in docs/15_F2_06_LIGHTING_REVIEW.md. **Does not imply equivalence to Kingshot art or playable combat.**
- [x] **F2.07** render culling, static batching, geometry memory budget diagnostics; benchmark and log. CI 42781681067: 154 tests, typecheck/build, real Chrome/WebGL2 501st-object camera rejection, unchanged pad clicks, world and cinematic screenshots. World study: 2 static terrain meshes, 16 color draws + 16 sun-depth draws, ~5.87 MB estimated allocations. See docs/16_F2_07_RENDER_BUDGET_REVIEW.md. NOT an FPS, VRAM or art-parity claim.

## F3 — first fully playable 3-wave loop
- [x] **F3.01** keyboard movement/collision, state snapshot, camera follow; tests diagonal speed and pause. CI **42790695145**: 161 Vitest tests, TypeScript, build, real Chrome 90-tick keyboard/camera loop and landscape/portrait WebGL2 screenshots; previous fixed-step loop pause tests remain green. Original scene/lighting preserved. Reviewed visual quality in docs/17_F3_01_MOVEMENT_REVIEW.md. **Keyboard locomotion only—not combat, touch controls, or articulated run animation.**
- [x] **F3.02** deterministic enemy road progress and bounded spawn queue, Scrapper/Runner balance HP/speed/strike metadata; wave-1 ten Scrappers and wave-2 fourteen Scrappers/five Runners. CI **42793655064**: 168 unit tests, strict TS, build and real Chrome/SwiftShader live scene march in both aspect ratios plus legacy pad-click checks. Original Runner model, per-lane 1.2m gate spacing and screenshot inspection documented in docs/18_F3_02_RAIDER_MARCH_REVIEW.md. **No active enemy damage, projectile combat or functional wave controller yet.**
- [x] **F3.03** 7m hero auto aim/fire and real-time bolt projectile, hit registration, target ordering. CI **42797369454** passed **176 Vitest tests**, strict TS, production build, real Chrome/SwiftShader physically in-flight copper arrow + moving-target swept hit/damage, with landscape/portrait screenshots inspected (art critique in docs/19_F3_03_PROJECTILES_REVIEW.md). Authoritative 8-HP damage persists and downed enemies cease movement; no loot, coins, tower firing, enemy counterattacks or complete wave controller yet.
- [ ] **F3.04** kill resolution and copper pickups with magnet + exact integer credit; prevent double collection.
- [ ] **F3.05** Bolt Spire pad selection, 20-coin buy, spawn, firing, upgrade T2; atomic cost validation.
- [ ] **F3.06** core damage/death, hero respawn, pause, win/lose HUD; end-to-end tests.
- [ ] **F3.07** waves 1–3, recovery transitions, wave reward, cost progression; seeded simulation golden tests.
- [ ] **F3.08** onboarding four microprompts, desktop HUD, input feedback, no obscuring overlays.
- [ ] **F3.09** Playwright real browser smoke and movement/build flow; capture screenshots. Human playtest milestone.

## F4 — art completeness and animations
- [ ] **F4.01** rigid skeleton pivot animator + state transitions idle/run/fire/dash/hit/die; deterministic animation clocks.
- [ ] **F4.02** all enemy archetype parameterized meshes, role-distinguishable in 1080p and portrait.
- [ ] **F4.03** detailed hero mantle, cloth hinge, bolt yoke, distinctive gold read; art gate.
- [ ] **F4.04** towers family meshes including tiers 1/2/3; model visibly changes with each tier.
- [ ] **F4.05** projectiles/mortar trajectories, low-cost impact VFX, pooled geometry.
- [ ] **F4.06** wave presentation + victory/defeat animations, reduced motion alternatives.
- [ ] **F4.07** baseline screenshot comparison to bible's strict palette/silhouette standards.

## F5 — combat depth / control
- [ ] **F5.01** Shieldbearer frontal directional damage and visual reaction; combat unit tests.
- [ ] **F5.02** Sapper tower targeting, tower HP/repair; test no hidden reroute.
- [ ] **F5.03** Banner aura capped 1.2× and readable periodic pulse; tests no multiplicative stacking.
- [ ] **F5.04** Behemoth boss attacks, warning geometry and spawns, budget cap.
- [ ] **F5.05** Arrow Rack / Lobber / Signal Ward full behaviors and upgrades; test DPS/area/buff.
- [ ] **F5.06** touch analog joystick and dash/build buttons via nipplejs; mobile Playwright and real device inspection.
- [ ] **F5.07** ZzFX audio presets, user gesture unlock, audio concurrency limits, mute/mix controls.
- [ ] **F5.08** player dash and ability rally pulse; fixed tick and collision tests.

## F6 — campaign / persistence
- [ ] **F6.01** rounds 4–10 with exact composition/boss wave and balancing.
- [ ] **F6.02** 3 more map templates, seeded prop/road generation with protected collision zones.
- [ ] **F6.03** upgrades/recovery bonuses/repair/sell rules and no-grind campaign progression.
- [ ] **F6.04** results screen stats, seed, restarts.
- [ ] **F6.05** IndexedDB schema, save/resume/migrations and corrupt save recovery, tests.
- [ ] **F6.06** route-branching prototyping with PathFinding.js **only if needed**.
- [ ] **F6.07** difficulty profile tests: beginner, deliberate and stress play patterns.

## F7 — performance, polish, accessibility
- [ ] **F7.01** instancing draw-call and GPU memory measurements (100+ enemies).
- [ ] **F7.02** broadphase spatial hash, pooled effects, no per-tick allocations hot path after warm-up.
- [ ] **F7.03** mobile resolution/render scaling, reduced-motion and high contrast.
- [ ] **F7.04** keyboard focus, UI semantic labels, menus, touch safe zones.
- [ ] **F7.05** integration QA against browser consoles/screenshot diffs/balance table.
- [ ] **F7.06** first-run onboarding polish, no tutorial wall, input responsiveness benchmark.
- [ ] **F7.07** audio art-direction pass and no faux epic soundtrack.

## F8 — delivery and maintenance
- [ ] **F8.01** repeatable build/deploy with staging URL; verify actual host and its HTTPS conditions.
- [ ] **F8.02** visual regression baselines; no reference screenshot used as direct game asset.
- [ ] **F8.03** third-party attribution, exact licenses, dependency audit and SBOM.
- [ ] **F8.04** README operating handbook, controls, troubleshooting, game loop and settings.
- [ ] **F8.05** release candidate tests with artifacts; user signoff before public production release.

## Dependency graph
F0 → F1 → F2 → F3 (PLAYABLE VERTICAL SLICE); then F4+F5 → F6 → F7 → F8. Certain F0 unit tasks and F1 graphics tasks can run independently *but* this conversation loop must keep changes small, testable and reviewable.

## The anti-fake completion law
Never mark an item done because code was written alone. Completion requires: corresponding code on GitHub, tests actually executed and logged, build status, screenshot evidence for visual work, and cross-system integration where applicable. If tools cannot execute commands, label **implementation committed; verification pending** and leave task unchecked. A future turn can verify with CI if available.
