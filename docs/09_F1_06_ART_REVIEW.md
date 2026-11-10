# F1.06 — screenshot-based art acceptance

**Date:** 2026-11-10. **Artifact:** [GitHub Actions run 42759135468, screenshot artifact 13736538630](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42759135468/artifacts/13736538630). Screenshot filename: `bastionfall-gallery-landscape.png` (1200 × 900 headless Chrome window, canvas approx. 1027 × 495 CSS pixels).

## What was actually inspected

A real screenshot was downloaded from GitHub Actions, extracted and examined (including a magnified crop of the actor group). The canvas uses the locked WebGL2/SwiftShader renderer and 45° fixed orthographic camera. Visible result: four grounded art-review plinths from left to right — **Warden** (blue hood + gold mantle and offset launcher), **Scrapper** (narrow red vertical profile + upright spear), **Shieldbearer** (broader hostile silhouette with a dark foreground shield), and **Frontier Keep** (stone foundation and buttresses, slate-blue gabled roof, gate surround and pennant). They are visually distinct from one another and built from our F1.03 procedural primitives and canonical material tokens; there are no copied external assets.

**Accept for F1.06 initial archetype gate:** silhouette roles and team allegiance are identifiable on real rendered output. The screenshot matches the specified shapes, primary palette roles and fixed camera. CPU mesh/hierarchy/palette tests verify all four authored meshes and the named components; the browser renders **8 instances across 6 draw calls** (4 archetypes and 4 exhibition plinths).

## Limits and follow-up

- Fine hood, bolt launcher, and shield detail become difficult to read at normal play scale. Hero and enemy bases occupy only a small portion of a large 31 m camera viewport; animation/readability evaluation must be repeated in motion at 800px width in F3 and during F2 scene composition.
- The screenshot is of a **neutral asset gallery**. There is no authored terrain, road, lighting shadows, waving cloth, unit animation, collisions, waves, or player interaction. The keep currently dominates because it correctly spans several meters. This does not count as a playable scene or a final visual-quality pass.
- Screenshot obtained from software-rendered headless Chrome on CI, **not an integrated-GPU benchmark or mobile physical-device review**. No claim of 60 FPS or hardware performance.
- CI verifies WebGL2 start/unavailable, gallery draw counts, portrait/landscape layout, error overlay and preserved 500-instance benchmark. The screenshot itself was inspected by the assistant as a still image, not automatically pixel-scored against a reference aesthetic.

**Review judgment:** F1.06 initial art gate is met with identified readability risks. Continue F2.01 deterministic terrain next. Keep this record as factual evidence for future visual iteration.
