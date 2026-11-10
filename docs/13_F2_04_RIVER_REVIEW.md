# F2.04 — northern river and earth/rock bank acceptance

**Date:** 2026-11-10. **Map:** Fenwall Crossing, deterministic seed `fenwall-crossing-v1`.

**Evidence:** [PR #15](https://github.com/lordfireballzmc/BrowserGame/pull/15), [GitHub Actions run 42768012673](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42768012673), [F2.04 screenshot artifact 13740203473](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42768012673/artifacts/13740203473).

## Exact implementation

- `src/art/terrain/RiverPath.ts` defines a fixed **66-meter decorative northern corridor**, sampled every **1m** in X from −33 to +33 with a shallow hand-authored world-Z bend near +19m. Both endpoints narrow gradually to small pointed sections entirely inside the existing clipped island coast. The path is deterministic and independent of the gameplay/map seed.
- The same path formula drives `riverCarveDepth(x,z)` in `src/art/terrain/Island.ts`, so the terrain is actually cut **below** the river surface and sample heights remain exactly the same along all 54 adjacent tile edges. Channel maximum carve is **0.58m**, and the flat water plane is at **Y=−0.20m**. This was corrected down from an initial 0.72m cut after the unchanged F2.01 0.65m/1m slope regression detected a 0.689m sample step; the final source preserves that regression test.
- `src/art/terrain/River.ts` generates one flat-shaded, no-texture `water` material mesh and a second faceted bank mesh in **two semantic strata**: `earth.cut` upper and `stone.shadow` lower. It uses F1.03 validated indexed triangles, hard normals, exact measured bounds and fixed palette indices. All river water and bank vertices lie inside the island footprint; no blue rectangle lies on top of uncarved grass.
- Two small original **wooden crossings** are instances of one cached 3D bridge mesh built from separate beveled timber planks, rails and posts with canonical `timber.base` and `timber.light` materials. The bridges are at world X = **−16m and +16m**. These are **visual-only stage details**, with no hero/enemy navigation edges, alternate spawn or hidden combat route. F2.05 vegetation placement must honor the river corridor as an additional exclusion zone.
- `tests/river.test.ts` introduces **9 tests**: 66 segments and paired bridge positions; mesh validity and palette; every vertex inside the island; sampled terrain beneath the water surface; continuous centerline and tapered ends; pad/road avoidance; two-seed adjacent tile equality; deterministic/cached geometry; and rejected malformed inputs.

## Verified browser result

The screenshot was downloaded from the successful GitHub Actions run and actually inspected. From the camera's full-island 1280×960 orthographic inspection view, the blue-green river is visibly inset along the map's northern/world-+Z edge (near the foreground in the image). Two wooden bridge deck/rail silhouettes cross it. Brown upper banks, darker rock lower edges, ten stone pads and their existing price/lock labels, and the pale ochre central road remain distinguishable. There are no obvious grass polygons crossing the water plane or road intersections with the river. The cut ends taper on the island; **the river is deliberately decorative and not yet an animated current**.

**Limitations:** This is a fixed full-map screenshot from software WebGL2, not a physical integrated-GPU benchmark. Water has no animated flow or reflection, fog, textures, physics or collision blocking. The crossing visuals are small at this camera scale; gameplay camera composition and occlusion review are reserved for F2.06. Water looks like a quiet ribbon, not a complete dynamic river simulation. No actual game stage has been integrated into the main diagnostic; `tests/terrain-preview.html` remains a noninteractive world inspection except for the previously implemented pad-selection probe.

## Exact acceptance evidence

Green GitHub Actions **run 42768012673** (prior to final documentation-only commits): Node 22 locked install, strict TypeScript, **135 Vitest tests across 14 files**, Vite production build, WebGL2 unavailable fallback, 500-object instancing test, portrait/landscape diagnostic, error overlay, authored model gallery, real **terrain+road+ten pads+northern river** software-WebGL2 rendering and screenshot. Browser trace: **54 terrain tiles, 430 coast segments, 66 river spans, 2 bridges, 95 instances / 85 draw calls, 13,726 triangles**; all ten existing price labels remain in DOM, and Chrome's registered canvas-click checks still select P01 and reject locked P09.

The displayed approximately **2ms CPU submit** value is not a GPU frame timer or achieved FPS. A physically playable scene and visual screenshots at hero-scale remain pending.

**Acceptance:** F2.04 low-poly riverbanks, water palette, and decorative bridges complete, with unchanged navigation fairness and no water textures or visual fog. **Next F2.05:** seeded deterministic placement of trees, rocks, grass and flowers with exclusion zones and caching.
