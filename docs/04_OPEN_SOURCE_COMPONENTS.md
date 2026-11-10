# Open-source component research and integration matrix
Research checkpoint: 2026-11-10. This is a curated architecture and suitability survey, **not** a claim that each library has been installed, benchmarked, audited, or proved compatible with every other. Dependencies are linked directly to upstream GitHub; check tagged releases, dependency trees, security advisories, current licenses, and APIs *before* each integration. Pin resolved versions and commit the lockfile. Preserve notices in third-party attributions.

## Architectural principle
**Active architecture** owns deterministic strict-TypeScript simulation and business rules while **Three.js r184 is already the selected main renderer/scene graph, GLB loader and skinned-animation framework**. TWGL/custom WebGL2 is a retained legacy diagnostic/fallback only. Historical instructions prohibiting Three.js are superseded by the [VQ directive](29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md), [ADR-023](23_ASSET_FIRST_THREE_MIGRATION_ADR.md) and checked-in source. Use external technologies where they materially improve real art; pin packages, audit licenses and avoid redundant dependencies.

## Active rendering / fidelity evaluation (do not mistake links for integrated packages)
| Need | Technology | Status |
| --- | --- | --- |
| 3D scene + GLB animation | [Three.js](https://github.com/mrdoob/three.js) | **Already integrated**, r184/WebGL2 |
| High-DPI sizing | Existing `src/engine/render/CanvasRuntime.ts` and [Three.js responsive guide](https://threejs.org/manual/en/responsive.html) | **Integrated VQ.01**, real Chrome DPR2 and resize/quality proof in CI #42888985727 |
| Selective antialiasing/post | [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | **Candidate only**; compare cost, sharpness, ghosting vs working MSAA |
| PBR comparison reference | [Khronos glTF Sample Viewer](https://github.com/KhronosGroup/glTF-Sample-Viewer) | Reference implementation, **not installed** |
| GLB optimization | [glTF-Transform](https://github.com/donmccurdy/glTF-Transform), [meshoptimizer](https://github.com/zeux/meshoptimizer), [KTX-Software](https://github.com/KhronosGroup/KTX-Software) | Candidates, adopt with licensed asset provenance and fidelity tests |

## Approved candidates with upstream links
| Requirement | Candidate and upstream | License advertised/upstream | Exact integration boundary and test | Stage |
|---|---|---|---|---|
| WebGL state/buffers/shaders/VAOs | [TWGL](https://github.com/greggman/twgl.js) | MIT (verify pinned tag) | Use createProgramInfo, createBufferInfoFromArrays, setUniforms, drawBufferInfo; own renderer, culling, mesh cache, draw scheduler; test WebGL2 init and 1,000 instances | F0–F1 |
| vector/matrix/quaternion | [gl-matrix](https://github.com/toji/gl-matrix) | MIT | Use vec3, mat4, quat and camera projection; validate world-screen transform invariants | F0–F1 |
| seeded smooth height/noise | [simplex-noise.js](https://github.com/jwagner/simplex-noise.js) | MIT | Always pass seeded PRNG explicitly; sample only during mesh generation; snapshot tile boundaries | F2 |
| deterministic PRNG | [alea](https://github.com/coverslide/node-alea) | MIT (re-check exact package) | Use explicit injected random stream, or use local xorshift32 V0; no Math.random in game state | F0, F2 |
| polynomial easing / UI tweens | [tween.js](https://github.com/tweenjs/tween.js) | MIT | UI cosmetic tween only; gameplay animation tied to fixed tick instead | F4 |
| pathfinding for branching maps | [PathFinding.js](https://github.com/qiao/PathFinding.js) | MIT license text in README | Map cell grid for reroutes; NOT necessary for fixed spline in F1 | F6 |
| static prop broadphase | [rbush](https://github.com/mourner/rbush) | MIT (re-check release) | Only index static collision rects; profile vs spatial hash before adopting | F5 |
| polygon triangulation | [earcut](https://github.com/mapbox/earcut) | ISC (re-check release) | Triangulate only road junction caps, shore polygons, bridge footprints | F2 |
| sound synth | [ZzFX](https://github.com/KilledByAPixel/ZzFX) | MIT | Generate sounds deterministically at init, unlock after gesture, throttle simultaneous events | F5 |
| larger sound management optional | [howler.js](https://github.com/goldfire/howler.js) | MIT (re-check release) | Adopt only if mixer/audio sprites complexity requires it; avoid with ZzFX if redundant | F8 |
| mobile virtual stick | [nipplejs](https://github.com/yoannmoinet/nipplejs) | MIT | Restrict touch zone, adapt event API for chosen release, verify two-finger button press | F5 |
| IndexedDB wrapper | [idb](https://github.com/jakearchibald/idb) | ISC (re-check release) | Atomic versioned snapshot transactions; test migration + failed writes | F6 |
| general unit and property tests | [Vitest](https://github.com/vitest-dev/vitest) | MIT | deterministic simulation, math, PRNG, geometry validity; use current compatible Vite/Node | F0 |
| browser integration testing | [Playwright](https://github.com/microsoft/playwright) | Apache-2.0 | desktop/mobile viewport smoke, screenshots, input, gameplay flows; Playwright tests game only, **not ChatGPT UI** | F2–F10 |
| bundler/dev server | [Vite](https://github.com/vitejs/vite) | MIT | custom engine packaged with TypeScript; dev server & optimized production build | F0 |
| language | [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 | strict TS, no implicit any; build/typecheck | F0 |
| procedural low-poly mesh patterns | [webgl-fundamentals](https://github.com/gfxfundamentals/webgl-fundamentals) | license review per file | Reference **ideas** for normals, buffer instancing, camera math; do not copy snippets unlicensed | F1 |
| render performance diagnostics | [webgl-memory](https://github.com/greggman/webgl-memory) | MIT (re-check release) | dev-only reporting of GPU buffer/texture pressure | F8 |
| color parsing alternative | [culori](https://github.com/Evercoder/culori) | MIT | Useful if advanced color conversions; otherwise direct palette floats are enough | optional |
| procedural sampling (candidate) | [poisson-disk-sampling](https://github.com/kchapelier/poisson-disk-sampling) | confirm license + API | Seeded decoration positions and exclusion; do not import until tested | F2 |

## Rejected as initial foundations
- **Historical rejection now superseded:** Three.js is already the main engine; do not forbid it because the first prototype was custom. Babylon.js and alternatives require actual measured benefits to justify migration, not speculation.
- react-three-fiber: brings abstraction weight and delegates to Three.js.
- Full-fledged physics: unnecessary for grounded fixed-lane units and lightweight projectile arcs; use analytic collision, swept circle, grid/segment broadphase. Evaluate [Rapier](https://github.com/dimforge/rapier) (Apache-2.0) only after tests establish true rigid-body needs.
- [bitECS](https://github.com/NateTheGreatt/bitECS): attractive but evaluate license/version and actual needs before adoption; no dependency added reflexively.
- [miniplex](https://github.com/hmans/miniplex): check Mozilla Public License 2.0 and conditions before any inclusion. Not approved for immediate integration.
- Copying a game clone or importing a stranger's full game: incompatible semantics, unknown provenance, huge coupling, and copyright risks.

## System-to-code contracts (ownership / external help)
1. **Engine host:** own `src/engine/Loop.ts`; rAF+accumulator fixed 1/60 tick; maximum 5 catch-up ticks; pause on hidden tab; interpolation alpha.
2. **Rendering (current):** maintain game-specific interfaces in `src/engine/render/*`, but use the existing Three.js `UnifiedThreeRenderer` for active combat/world GLB, PBR and skinning. Retained TWGL is only for explicit legacy diagnostics/regressions until feature-parity verification; retain efficient instancing and GPU resource cleanup.
3. **Camera:** gl-matrix mat4 ortho+lookAt; deterministic follow state; projection tests.
4. **Meshes:** own `src/art/mesh/*` geometry constructors; earcut for irregular caps and sampled noise only; generator input: seed + archetype config; output: geometry arrays, bounds, stable hash.
5. **Actors:** own typed data-oriented arrays or lean entity store; don't add ECS framework until profiling shows need. Entity creation/destruction deferred to end of tick.
6. **Collisions:** geometric analytic capsules/circles for moving enemies; rbush only after numbers and colliders warrant it; use spatial hash for dynamic enemy separation.
7. **AI:** waypoint spline progress is authoritative; optional grid A* pathfinding only for branching obstacles. Never repeatedly run A* per enemy per frame.
8. **Wave scheduler:** pure seeded generator, tested counts, no unbounded spawn while loops.
9. **Projectiles:** vector ray tests or swept segment, actual travel; mortal collisions; stable ordering.
10. **Economy:** simple integer transaction state machine, tests for insufficient funds, double purchase, coin duplication, refunds.
11. **Animation:** local keyframe interpolator on rigid pivots; tween.js restricted to UI cosmetic transitions.
12. **Effects:** baked mesh pool and instance buffers; ZzFX synthesized sound; no large particle runtime.
13. **Controls:** native keyboard/pointer + nipplejs only for touch; pointer capture, focus loss, menu priority; simulation receives input snapshots.
14. **Persistence:** idb snapshots with schema version, seed, tick, named events; no save serialization of WebGL handles.
15. **QA:** Vitest for pure systems, Playwright for game-only browser tests and screenshot artifacts.

## Integration checklist per component
- Write reason and exact imported functions in ADR.
- Check repository license text at exact tag, transitive dependencies, current advisories and ESM behavior.
- Install with exact compatible major; lockfile committed. Prefer stable releases, not latest pre-release.
- Build adapter module; forbid direct dependency imports throughout unrelated gameplay files.
- Add test of integration boundary, deterministic behavior if relevant, and failure-path fallback.
- Benchmark release build; record actual platform and sample size.
- Attribute upstream copyright and license; no copying asset art.
- If library integration fails, do not rewrite the engine architecture simply to accommodate it.

## Dependency provenance
GitHub repositories above are references; no third-party source has been copied into this repo as of this research checkpoint. We must not claim that external code has been 'stitched together' until actual integration commits exist.

## Important version concerns
- TWGL evolves: choose full/minimal module and verify WebGL2 interfaces.
- nipplejs has breaking 1.0 API changes; use current API from selected exact version.
- simplex-noise uses Math.random without custom PRNG; passing the seeded stream is required.
- Vitest may require newer Node/Vite; establish supported Node LTS in CI.
- These links cannot prove game performance in isolation. Run and record benchmarks.
