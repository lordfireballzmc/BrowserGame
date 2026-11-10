# F2.07 — static batching, conservative frustum culling, and honest draw/memory metrics

**Milestone:** renderer scalability. This reduces work on the existing original WebGL2 world; it does **not** increase geometry detail or establish Kingshot visual parity.

## What changed
- `src/art/mesh/StaticBatch.ts`: CPU-only deterministic static mesh concatenation. Preserves **all** original world-space vertices, normals, triangles and semantic material slots; selects Uint16/Uint32 indices according to the merged vertex count. It does not weld coastline vertices or alter physical geometry.
- `tests/terrain-preview.html`: merges the island's original **54 surface tiles into one static mesh** and all cliff sections into another. Island culling is enabled only after these meshes are created. Unchanged original road/river, ten build-pad prices/clicks, 258 seeded scenery instances and posed figures remain in the scene.
- `src/engine/render/Frustum.ts`: conservative eight-corner transformed AABB against all six homogeneous camera clip planes. Rejects a mesh only when every bound corner is completely outside the same plane; handles rotated models and partially visible silhouettes without center-only rejection.
- `src/engine/render/InstancedRenderer.ts`: opt-in camera frustum filtering for color draws; independent **sun-light frustum** for opaque shadow casters so off-camera objects can still shade visible geometry. Existing per-mesh/material instancing and transparent sorting preserved.
- Renderer now reports `culled`, `shadowDrawCalls`, `shadowInstances`, `shadowTriangles`, and `estimatedGpuBytes`. Memory is an explicitly described **CPU-derived allocation estimate**, including static geometry, dynamic instance-buffer capacity, and an approximately four-byte/pixel 1024² shadow-depth texture budget. This is not a VRAM query or GPU timing result.
- `tests/f2-07-culling-batching.test.ts`, `tests/renderer.test.ts`, `tests/renderer-benchmark.html` and Chrome CI checks cover partial visibility, rotations, exact merged attributes, stable draw counts, a physically offscreen 501st instance, and the real preview.

## Independently verified
[GitHub Actions run 42781681067](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42781681067) on branch head `54600c112c7bf594b1d08f97840424984978a3c7` passed:
- Node 22 locked install, TypeScript typecheck, **154 Vitest tests**, production build.
- Real headless Chrome SwiftShader WebGL2: 500 original boxes rendered in one color draw, with an intentionally added 501st offscreen box culled. This test demonstrates rejection, not a real-world speed-up percentage. Historical unculled 500-instance CPU-submit p95 on this runner: **41.7 ms** (10 warm-frame samples); separate single culling-frame CPU-submit **0.9 ms** is **not** a comparable timed benchmark because of inconsistent workloads, sample counts, and system effects.
- Real original island inspection preview, preserved 258 seeded props, 10 pad labels, P01 selectable and P09 blocked through actual canvas clicks. Captured fresh full-map PNG and compared its material and prop silhouettes by eye; batching did not visibly break the scene.
- Real 16:9 and portrait cinematic WebGL2 shadowed scenes, each captured to screenshot artifacts, downloaded and inspected. No missing ground or road geometry.
- World trace: **290 submitted / 290 visible instances, 16 color draws, 31,790 color triangles; 16 shadow draws / 31,790 shadow triangles**, approximately **5,872,992 estimated allocated GPU bytes** at this initial composition. The map overview naturally culls **zero** objects because all fit its camera; in closer views rejection is available. No claims of GPU FPS.
- Captured image artifacts in run: full world `f2-05-seeded-scenery-screenshot` and both cinematic compositions in `f2-06-cinematic-visual-studies`, representing current code despite the earlier historical artifact labels.

## Critical limitations and next step
- Static terrain batches are global: they reduce draw calls, but because each has a broad combined AABB they cannot individually cull offscreen terrain subtiles. Future **chunked** static batching may improve small viewports when profiling justifies it.
- The shadow map still redraws each visible or shadow-relevant batch every frame; no static shadow cache, GPU timer query, mobile GPU test or driver-level VRAM measurement.
- Current art is still simpler than the supplied Kingshot screenshot. Detail, texture/material sophistication, animation, lighting artistry, and actual gameplay remain separate milestones. **F3.01** is the next scheduled implementation, starting a genuine headless-testable player movement/world state.
