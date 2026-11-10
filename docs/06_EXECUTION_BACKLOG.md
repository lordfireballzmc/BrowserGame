# Execution backlog — machine-readable human-readable source of truth

Every task includes ID, dependencies, deliverable, test gate, and asset/visual gate. The agent must implement **one bounded incomplete task at a time**, commit, update status, then continue. Status: [ ] not started, [~] in progress, [x] completed with verification. Never check off without evidence. Ordering may be changed only with written rationale. **F0 is first.** F3 finish provides true playable loop; no fake demo presented as full product.

## VISUAL-PIPELINE OVERRIDE — user-ordered production upgrade
- [x] **ART.01** Upgrade engineering environment from mandatory primitives to a **reproducible professionally authored, licensed, locally bundled textured GLB pipeline** with Three.js/WebGL2 in the **actual active Warden scene**, independent art/copyright provenance and photo/screenshot gate. Source pinned CC0 Lantern technical sample (NOT final game art); preserve the legacy simulation, prove model/texture/camera integration in desktop + portrait, and explicitly plan retirement of the temporary dual-WebGL2 bridge. Verified [PR CI 42822409551](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42822409551): 178 Vitest tests, strict TypeScript, production build, all original browser graphics/pad/combat regressions and actual imported textured GLB in both 16:9 and portrait Warden scenes. Real screenshots downloaded and reviewed, model visible but small; no commercial art parity. See `docs/00_MASTER_PRODUCTION_DIRECTIVE.md`, `docs/23_ASSET_FIRST_THREE_MIGRATION_ADR.md` and `docs/24_ART01_TEXTURED_GLTF_BROWSER_REVIEW.md`.
- [~] **ART.02** First concrete slice **ART.02a**: shared WebGL2 canvas/GLB/depth/shadow for actual 3D terrain, road, Warden/raiders, bolts, with original scene geometry converted to Three BufferGeometry and GPU InstancedMesh, retained tested camera/physics, and explicit legacy regression fallback. [CI #42824821031](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42824821031) passed 182 tests, TypeScript/build, old gameplay and unified real Chrome landscape/portrait screenshot probes. The two-canvas ImportedArtLayer is deleted; Warden movement defaults to unified Three. **Still incomplete:** unified static map and cinematic routes, measured mobile performance, focal GLB character/keep replacement and eventual legacy engine retirement. Detailed visual critique in `docs/25_ART02_SINGLE_SCENE_REVIEW.md`.
- [ ] **ART.03** Establish a coherent licensed or authored **cartoon-fantasy** GLB character/environment family with versioned rig/texture/animation pipelines; replace original low-detail Warden/Scrapper/keep where quality is proved superior.
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
