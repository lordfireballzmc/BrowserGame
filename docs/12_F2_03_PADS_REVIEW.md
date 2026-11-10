# F2.03 — build-pad geometry, price projection and interaction review

**Date:** 2026-11-10. **Stage:** Fenwall Crossing, seed `fenwall-crossing-v1`.
**Evidence:** [PR #14](https://github.com/lordfireballzmc/BrowserGame/pull/14) · [Actions run 42765717462](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42765717462) (final functionality source, before documentation-only revisions).
**Initial screenshot:** [F2.03 Chrome artifact 13739378185](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42765377948/artifacts/13739378185) — screenshot retrieved from GitHub Actions and visually inspected.

## What was implemented

- Ten **explicit, fixed world-XZ pad positions**, independent of seed and viewport, with 4×4-meter build/hit footprints and an octagonal visible stone plinth radius of **1.8m**. Every plinth sits outside the road (minimum 2m gap beyond the 2.25m road shoulder and stone radius), fully within the island boundary, not overlapping the 7×7m keep, and separate from every other 4×4 pad area. These are designer-chosen positions relative to the authored F2.02 road, **not randomized placement**.
- Unlock schedule exactly **2 at wave 1**, **2 more at wave 2**, **3 more at wave 4**, **3 more at wave 7**. Prices are taken from the canonical Bolt Spire base cost **20 crowns** in `src/game/Balance.ts`, not a fabricated numeric label. Locked sites display the wave at which they unlock. Affordability changes label tone but does not mutate game currency.
- `src/art/terrain/Pads.ts`: one cached flat-shaded carved-stone foundation mesh of two genuine eight-sided tiers and **four inset engraved notch bars**, all canonical palette material IDs. One separate optional *actual geometry* ring contains **16 spaced stone-highlight dashes**: it is only rendered when a selectable pad is targeted, not a permanent glow. The pad base extends below its ground anchor to conceal mild local height variations.
- World-coordinate hit testing checks the **4×4m footprint** and wave-lock status. `pickPadAtScreen` accepts existing `OrthoCamera.screenToGround` in CSS pixels so changing viewport aspect/camera position cannot select a different pad via stale screen rectangles. Pad prices anchor via `OrthoCamera.project` and real per-seed terrain heights.
- `tests/terrain-preview.html` adds ten instances of the shared stone-pad mesh in **one WebGL2 instanced draw** and HTML price labels projected through the exact 3D camera matrix. A real canvas click resolves to a ground intersection and displays the optional 16-dash targeting ring. The preview is a separate engineering inspection route, **not** the game HUD or tower construction screen.

## Screenshot inspection

The downloaded actual **1280×960 Chrome** screenshot displays all ten pads as visible octagonal gray miniature foundations distributed down both sides of the road. The **two 20-crown labels** near the western approach are clearly legible. Eight later-wave labels display Wave 2/4/7 in muted gray. At this full-map inspection scale the pads are small, but each is distinguishable from the grass and road without obscuring the road. Label placement is grounded in projected pad coordinates, rather than manually located CSS positions. No obvious label collision was seen in this landscape view.

**Limits:** This screenshot is full-island landscape only. Portrait/live camera framing and pad/keep occlusion/fade have not been visually accepted at a real gameplay zoom. Real tower construction, spending currency, pad occupancy and wave-control integration belong to F3.04 and later. One selected ring is exercised by the Chrome automated event smoke, not a human controller test.

## Verification

GitHub Actions run **42765717462** passed locked Node 22 install, strict TypeScript, **126 Vitest tests across 13 files**, Vite production build, the prior WebGL2 unavailable/positive/500-instancing/portrait/landscape/renderer-error cases, 54-tile terrain + road renderer, and F2.03 real DOM acceptance. The browser trace showed **10 pads**, **91 visible instances** and **82 draw calls** (80 terrain+cliff draws, 1 road, and **1 for ten batched pads**), **11,482 triangles**, two 20-crown price labels, eight locked labels, and ten present projection elements.

Two further actual Chrome sessions exercised the registered canvas click handler: **P01 selects and renders the target ring; P09 at wave 1 is rejected.** Both returned explicit `data-pad-click-probe="pass"`, confirmed in the CI logs. No GPU-time/FPS or phone interaction claim is made. Test corrections addressed one TypeScript authored-site literal inference and an old one-draw-per-object assertion that incorrectly rejected legitimate ten-pad instancing.

**Acceptance:** F2.03 initial pad model/placement/projection/selection gate met. **Next:** F2.04 authored northern riverbanks, cliff landscaping and water geometry.
