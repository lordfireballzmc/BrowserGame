# VQ.01 — Real native-DPI gameplay screenshot review

**Status:** technical milestone IMPLEMENTED and VERIFIED on 2026-11-10. PR #29 merged at `8c72c55bcde9780388403a3184d700d043a88c22`. The user-approved original illustrated 3D art target is NOT yet met.

## Verified source
- [CI #42888985727 — green](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42888985727): 193 Vitest tests / 23 files, TypeScript, production build and actual Chrome/SwiftShader GPU-backed WebGL2 browser regressions.
- [Actual DPR2 screenshot and trace artifact](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42888985727/artifacts/13796194576): landscape and portrait real gameplay, same skinned actors, enemies and projectiles.
- [Pre-change fixed-resolution screenshot artifact](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42852540671/artifacts/13781018146): old 1280×720 movement backbuffer regardless of actual CSS/DPR.

## Implemented
- Default Three.js Warden movement/combat scene now uses CSS canvas size × devicePixelRatio × economy/balanced/sharp preset with safe maximum 4,194,304 desktop color pixels or 2,073,600 coarse-pointer pixels.
- Physical GPU resize goes through WebGLRenderer, not direct live canvas.width assignment. Three setPixelRatio(1) is intentional because physical resolution was already calculated; camera aspect is updated. ResizeObserver, orientation, window and DPR changes are monitored.
- Graphics selector, CSS/physical/DPR readouts, and accurate rolling p95 frame-interval/JS CPU submission (NOT GPU frame time).
- Browser probes exercise actual live Sharp → Economy → Sharp and viewport resize → restore within the same scene, with real 19-raider Warden movement, 20 skinned actors and projectile damage retained. Existing map P01/P09 click acceptance and legacy/cinematic regression pass.

## Measured results — real Chrome
| View | CSS play area | WebGL backbuffer | Tier |
|---|---:|---:|---|
| Landscape DPR2 | 960×540 | **2400×1350** | Sharp, 1.25× DPR supersampling |
| Portrait DPR2 | 540×960 | **1350×2400** | Sharp, 1.25× DPR supersampling |
| Landscape DPR1 | ~1434.66×806.98 | 1434×806 | Balanced |
| Portrait DPR1 | ~594.56×1057 | 594×1057 | Balanced |

The DPI2 screenshot outputs are 1920×1200 landscape and 1080×1920 portrait, not raw framebuffer dumps. An early CI test prematurely sampled Chrome during asynchronous viewport restoration and failed; the test was corrected to await actual framebuffer restoration. The final exact-head CI passed.

## Actual visual critique
**Improved:** genuine higher-density crispness, less upscaled canvas blur, intact road/actor silhouettes and shadows, no evident wrong aspect or missing animated character in both reviewed images.
**Still below desired art quality:** blank gray octagonal build pads, broad featureless grassy terrain, simplistic blue-roof keep, repeated geometric trees/rocks, tiny generic CC0 heroes/raiders and an engineering HUD. Native DPI cannot rescue weak modeling or art direction.
**Performance limit:** software Chrome checks prove correct rendering/pixels, not real desktop or mobile GPU FPS, thermals, touch input or battery life. No claim of completed commercial-quality graphics or final art approval.

## Next milestone
**VQ.02 is next:** a coherent, legally verified original sculpted/textured keep + build-pad architectural kit (or demonstrably more impactful environment family) with correctly integrated scale, pad interaction, shadows/materials and actual 16:9/9:16 before-after game frames. Keep F3.04 coin/reward economy active in parallel. Preserve the original playful illustrated 3D direction without copyrighted Kingdom Rush imagery or Rise-of-Kingdoms-style gloss.
