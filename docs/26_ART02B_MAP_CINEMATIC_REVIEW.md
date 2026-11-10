# ART.02b — Unified full-island map, pad interaction and cinematic studies

**Date:** 2026-11-10. **Milestone:** ART.02b full-island/cinematic integration accepted in branch CI `42832578697`, **PR #25 merge pending at time of writing**. This is an architectural and rendering milestone, **not a claim of Kingdom Rush-level production visuals**.

## Actual runtime changes
- The one-context `UnifiedThreeRenderer` is now the default in `tests/terrain-preview.html` for **full-island map**, **both cinematic compositions**, and the already-merged **Warden combat preview**. A query `renderer=legacy` preserves the old custom WebGL2 rendering path for reproducible independent regression comparisons.
- The real authored 72×48m island, 4.5m ochre road, river, bridge, keep, ten pads, 258 scenery instances and posed cinematic Warden/raiders/spires remain represented by their original geometry, converted to indexed color-accurate Three `BufferGeometry` with GPU instancing. The pinned textured CC0 wooden Lantern `glTF` joins the exact same Three scene, WebGL2 canvas/depth buffer and directional shadow atlas as native objects.
- Static map and cinematic scenes now **await optional local GLB texture decoding before the first still frame**, rather than painting a partially loaded scene that never updates. Movement remains responsive without waiting for optional asset decode; the strict gameplay browser probe still awaits real GLB readiness. These rules are distinct by design.
- Existing map-pad projection and genuine canvas pixel-space selection are preserved. The unlocked **P01** is selected, producing a pad ring; the locked **P09** remains unselectable at wave one. Full-island value labels stay tied to the actual camera, not screen-space dummy icons.
- **The legacy renderer has not been deleted.** Remaining diagnostic gallery, dedicated old-engine tests, cleanup/performance parity, and full replacement of engineering character meshes still need dedicated work. This milestone does not claim complete ART.02/ART.03 or mobile optimization.

## CI: what was really verified
- [Actions run #42832578697](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42832578697) passed **22 test files / 182 Vitest tests**, strict TypeScript, production build, WebGL2-disabled fallback, original gallery/map/pad-click/cinematic/legacy-combat browser checks, and the **new single-Three-scene map + cinematic checks**.
- For the new scene the project uses `scripts/probe_unified_chrome.mjs` with **Chrome DevTools Protocol and actual readiness**, rather than trusting `--virtual-time-budget` around asynchronous GLB texture decoding. Real Chrome/SwiftShader on GitHub Actions verified **one** active scene canvas, one shared depth renderer, sourced GLB with **three actual textured material instances**, actual terrain/shadows and **258 scenery placements**.
- In map mode both P01 selection and P09 refusal were exercised through the existing DOM canvas click and validated from authoritative UI state. Both 16:9 and 9:16 cinematic camera compositions retained their **15 staged figures** and **two static bolt spires**, now genuinely Three-rendered.
- Screenshots and JSON probe evidence: [run #42832578697](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42832578697), artifact **13772835552**, files `bastionfall-unified-map-P01.png`, `...-map-P09.png`, `...-cinematic-landscape.png`, `...-cinematic-portrait.png` and accompanying JSON. Downloaded and **manually inspected**. The first verified map frame contained **290 submitted instances, 19 graphics draw calls, 54 terrain tiles, 10 pads, 258 scenery placements**, a 79.51m road with 4.5m width and source-pinned Lantern model; the cinematic landscape frame had **142 visible / 150 culled scene instances**. These are validation/CPU counters, **not** measured GPU timing, real device FPS or physical VRAM.
- Additional verified Warden movement + 19 enemies + physical damage in both formats remains green in the same run.

## Visual critique against the authoritative 3D cartoon north star
The new sun shadows make tree canopies, stone pads, characters and the keep read as objects with physical depth rather than 2D flat shapes. The road remains bold and highly legible; the Warden/raider red-vs-gold distinction survives cinematic landscape and portrait.

**Critical deficits remain:**
1. **Primitive characters and staged poses**: flat block-heads, rigid shields/spears and no skeletal expressions, planted-feet motion, readable recoil or satisfying anticipation. Character anatomy lacks playful exaggeration at native screen size.
2. **Sparse terrain surfaces**: broad fields of single-color green with scattered repeated rocks and triangles; foliage lacks authored clusters, painted variation and charming silhouettes.
3. **Industrial tower pads**: large flat grey octagonal disks overwhelm detailed object hierarchy. Need sculpted stone, wood accents, 3D construction affordances and coherent UI tags.
4. **Keep framing/detail**: small keep in map, relatively large foreground roof in both cinematic compositions; roof still essentially flat blue polygons, missing soft painted texture variation, beams, props and personality.
5. **HUD/page shell**: screenshots include a long engineering heading/navigation above the canvas, and some canvas sections extend below the 900/1200px Chrome viewport; these screenshots prove renderer functionality, **not a professional full-screen mobile interface**.
6. **No objective mobile-budget proof**: dual-mode regression on GitHub's SwiftShader is not real device profiling; initial CPU submission costs and a 2048px sun shadow atlas require actual profiling/level-of-detail review before declaring mobile-ready.

**Acceptance directive:** Future iterations may not be approved merely because Three.js and GLB shaders function. The next art sprint must produce **cohesive original stylized 3D characters, rigged animation clips, detailed storybook architecture and material treatments** in both camera crops, with screenshot and motion comparison against `docs/20_VISUAL_NORTH_STAR.md`. Keep the asset-license manifests and original IP policy.

## Next development gates
- **ART.02c:** evaluate diagnostic/gallery conversion and shared resource lifecycle, pad input, static/cinematic lighting parity and use a single rendering backend once the regression safety net permits; do not remove old renderer before its tests have a verified equivalent.
- **ART.03a (highest user-visible priority):** properly licensed/external or independently authored **coherent storybook** hero/raider/keep/vegetation GLB family with real surface textures and design-consistent exaggeration. Do not default to realism or Rise-of-Kingdoms gilt.
- **ART.03b:** real bone animation, intent-driven motion and contact feedback in an engine animation mixer; maintain deterministic simulation independent from visual interpolation.
- **F3.04:** the next independent gameplay milestone remains one-time enemy kill resolution, crown drop trajectories, magnet collection and exact economy; F3.03 real bolt damage is intact.

Related: [Master directive](00_MASTER_PRODUCTION_DIRECTIVE.md), [Visual north star](20_VISUAL_NORTH_STAR.md), [one-scene gameplay ART.02a review](25_ART02_SINGLE_SCENE_REVIEW.md), [persistent session state](07_SESSION_STATE.md).
