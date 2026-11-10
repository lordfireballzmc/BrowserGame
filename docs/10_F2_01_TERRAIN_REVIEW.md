# F2.01 — deterministic island screenshot and geometry acceptance

**Date:** 2026-11-10 · **Seed:** `fenwall-crossing-v1` (uint32 3671866285).
**Evidence:** [GitHub Actions run 42761261950](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42761261950), [F2.01 screenshot artifact 13737942035](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42761261950/artifacts/13737942035).

## Verified geometry

- 72×48-meter footprint, 54 independently generated 8×8-meter terrain tiles, with a shared 1-meter coordinate lattice (9×9 sample heights per tile). Adjacent tiles share identical exact float32 edge heights **and actual coastline-clipped surface mesh vertices**.
- A deterministic convex superellipse clips island corners, so it is not a plain rectangular mesh painted green. 430 clipped shoreline segments are extruded 1.6–3.5m downward into two distinct rock strata, `earth.cut` and `stone.shadow`.
- Seeded coordinate-hashed relief uses no `Math.random` and is independent of tile iteration order. World anchor areas at enemy entry (-34, -5) and core (31, 2) remain at canonical y=0; adjacent non-cliff 1m height differences are below 0.65m.
- Surface and cliffs use F1.03's validated finite positions, hard normals, CCW triangles, measured bounds and semantic material IDs. The active fixed-angle renderer displays them through F1.04's instance-buffer infrastructure.

## What the real screenshot showed

The first real Chrome capture (run 42760991117) revealed a visually poor serrated ochre shoreline: individually colored dry-grass triangles formed repeated yellow teeth around the grass surface. **That art issue was corrected**, not ignored: F2.01 stopped assigning a dry-grass material to arbitrarily clipped shoreline faces. The second capture (run 42761261950), retrieved and visually inspected, shows a continuous muted green island top and low-poly earth/stone cliff rim with no obvious tile cracks or serrated color repetition.

The **current result is a quiet foundational terrain slab**, not a completed landscape. Height undulations are subtle at full-island scale. Road, pads, water, trees, grasses, elevation readability, architecture placement and shadow treatment are still upcoming F2 tasks. The screenshot shows an engineering preview only, not gameplay.

## CI acceptance and limitations

The final source CI run 42761261950 passed **102 Vitest tests** across 11 files, strict TypeScript, Vite production build, WebGL2-unavailable fallback, software-WebGL2 startup and 500-instance benchmark, portrait/landscape gallery render, error-overlay checks, plus a real WebGL2 terrain preview and screenshot capture.

**Measured diagnostic render:** 54 ground meshes + 26 cliff meshes = **80 instances / 80 draws**, **8,750 triangles**, 430 exposed coastline segments, 59,662 sampled framebuffer pixel positions changed from clear color. The recorded ~1.1ms is **CPU submission only** for one Chrome SwiftShader frame, not GPU time, interactive FPS, or integrated-GPU performance. No real phone/tablet, multiplayer simulation, or 60fps hardware benchmark was performed.

**Acceptance:** F2.01 geometry/seam/cliff gate met. Proceed to F2.02 authored 4.5m curved road. Integrating terrain with actual player control remains later work.
