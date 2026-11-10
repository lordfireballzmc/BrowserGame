# F2.02 — authored road and collision-lane acceptance

**Date:** 2026-11-10 · **Stage:** Fenwall Crossing.
**Evidence:** [GitHub Actions run 42763428735](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42763428735) · [Real Chrome screenshot artifact 13738467744](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42763428735/artifacts/13738467744) · [PR #13](https://github.com/lordfireballzmc/BrowserGame/pull/13).

## Geometry, navigation and terrain contracts

- One original, hand-authored cubic spline traverses the stage from **(-34m,-5m)** on the western border to **(+31m,+2m)** at the keep. Total centerline length in seed `fenwall-crossing-v1`: **79.51m**, smoothly winding through eight fixed authored waypoints.
- Its arc-distance resampling maximum measured horizontal chord is **0.548m** (target ≤0.55m; art bible allows ≤0.7m); no corners or visible kinks. The strip is **4.5m wide**, with symmetric **±2.25m** left/right offsets around every centerline sample and valid coastline clearance.
- `roadPointAtDistance(meters)` and `nearestRoadPoint(x,z)` return deterministic meters/progress/tangent, nearest point, signed lateral distance and lane occupancy. `isInsideRoadLane(x,z,radius)` shrinks the corridor by the actor's physical radius (0.55m hero is supported). These are **pure deterministic collision/navigation queries**, not evidence of a running enemy agent or full game physics.
- The single indexed WebGL2 road mesh has the exact canonical `road.primary`/ `road.rut` semantic material slots, **0.02m above** locally flattened ground. There are **21 short wagon-rut dashes**, separated by 3.5m, alternately inset to the two sides (not an unbroken repetition texture). Both mesh and lane are built from the same sampled spline.
- The neighboring island height samples are smoothly feathered around an authored road centerline with a **3.75m half-width** flat corridor, allowing 1m terrain-cell triangles to clear the 2.25m lane edge. Seeded tile seams and protected staging coordinates remain exactly reproducible.

## Real visual review: initial finding and correction

A real **1280×960** headless Chrome SwiftShader screenshot of the first road implementation (run **42762781941**) displayed one uninterrupted ochre winding path, including short rut markings, atop the island terrain. Two small dark-green zigzag islands were also visible near its shoulders: these were single-triangle slope-threshold color assignments, **not road cracks**.

The code removed the per-triangle grass-shadow tint and added a dedicated regression assertion. The revised screenshot from run **42763021519** showed those artifacts gone. Finally the road's clearance was adjusted from 0.04m to **the art bible's specified 0.02m**, and a new real screenshot was captured and inspected from run **42763428735**. It continues to show one continuous smooth lane with no obvious seams, visible stray shadow triangles, or road sections buried in the terrain.

The screenshot is an **engineering terrain-and-road inspection**, not the final stage. The core mesh, player, enemy streams, build pads, river, vegetation and combat have **not** yet been integrated into this world. The photographed road ending at the core position does not independently prove alignment with a final gate mesh or gameplay traversal. Those are future integration checks.

## Exact verification

GitHub Actions run **42763428735** completed successfully: Node 22 locked install; strict TypeScript; **115 passing Vitest tests across 12 files**; Vite production build; headless Chrome WebGL2 unavailable fallback, positive shader startup, 500-object instancing benchmark, portrait/landscape character gallery, renderer-error overlay; and real terrain-and-road screenshot capture.

The real Chrome diagnostic trace records **54 terrain tiles**, **430 cliff segments**, **81 instances / 81 draw calls**, **9,082 submitted triangles**, 4.5m road width, 79.51m route length, 0.548m maximum sample step, 21 rut marks, and 59,662 sampled framebuffer positions differing from the clear color. CPU submit timing recorded by one SwiftShader run is **not GPU execution time or FPS**. The 12 dedicated road tests include endpoints, arc sampling, slope/shoreline clearance, physical collision radius, cross-section width, deterministic seams, materials, and bad-input rejection; the subsequent visual regression test brings the total road test additions to 13.

**Acceptance:** F2.02 road mesh, underlying terrain preparation, and collision-lane contract verified. Next: **F2.03** grounded octagonal build pads, ten authored positions, projected price labels, and interaction region tests.
