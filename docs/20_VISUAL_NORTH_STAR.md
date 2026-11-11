# BASTIONFALL — VISUAL NORTH STAR · v2.0 (high fidelity + fluidity)

**LATEST VERIFIED HANDOFF — 2026-11-11:** VQ.01, VQ.02a, VQ.02b, VQ.02c and **VQ.02d are MERGED / real-browser verified**. [PR #34](https://github.com/lordfireballzmc/BrowserGame/pull/34) squash `ed03193f444d1bea25513a0c2b11e0e68cd20d81`; [exact-head full CI #42926944486](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42926944486) passed **207 Vitest tests / 27 files**, typecheck/build, real Chrome Warden/19-raider bolt combat, P01 selectable/P09 locked, landscape/portrait 3D undergrowth A/B, DPR2 and the older visual regressions. [Compiled production-site browser #42926944439](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42926944439) passed. 736 artist-authored KayKit grass instances + 48 bushes + 120 Kenney 3D CC0 flowers = **904 visual-only source models in seven GPU instanced batches (421,728 source triangles)**; all 258 original scenery sites and road/pad/gameplay collision unchanged; original visual fallback retained. [Persistent actual-screenshot critique](35_VQ02D_ILLUSTRATED_GROUNDCOVER_REVIEW.md). **NEXT: F3.04 real kill crowns, towers and waves; VQ.02e distinctive terrain/keep and portrait staging; VQ.03 polished materials/light; VQ.04 fluid animation; VQ.05 illustrated HUD.** Overall professional original game art, user signoff, real mobile FPS and public Pages deployment NOT established. Older handoffs below are historical, not next-task instructions.
**Decision recorded:** 2026-11-10. **Status:** authoritative user art-direction decision.  
**Audience:** every new ChatGPT development session, artists, technical artists, UI and animation engineers.  
**This document describes a TARGET, not the appearance of today's runtime.**

**Technically verified, ART STILL UNFINISHED:** VQ.01 sharp physical DPR; VQ.02a Kenney CC0 keep/ten pads; VQ.02b five KayKit tree models; VQ.02c source-hash natural boulders and continuous grassy ochre road verge; **VQ.02d** adds 904 source-licensed instanced original-author botanical pieces (736 grass, 48 shrubs, 120 flowers), verified in real Chrome landscape and portrait [critical review](35_VQ02D_ILLUSTRATED_GROUNDCOVER_REVIEW.md). **NEXT:** F3.04 real crown/tower/wave game; visually VQ.02e unique sculpted keep/terrain/road and better portrait framing, VQ.03 painterly material/light hierarchy, VQ.04 genuinely fluid skeletal foot plants/recoil/attack, VQ.05 crisp fantasy UI. Third-party CC0 art remains non-exclusive, not final user-approved studio quality.


## Executive art mandate
Bastionfall should feel like **an original, handcrafted 3D interpretation of the readability, personality and playful illustrated fantasy of Kingdom Rush**, not like Rise of Kingdoms, a glossy kingdom-building advertisement, or a crude low-poly engineering prototype.

**Three words:** **CHARACTERFUL · READABLE · TACTILE.**

An observed user correction supersedes the earlier glossy-looking concept mockups:
> “these graphics are siding too much on the direction of Rise of Kingdoms but i prefer inspiration from Kingdom Rush art style though 3D”

This is the **corrected visual north star** for future work. Kingdom Rush is a *stylistic quality reference*, not a licensed asset source. Never copy its actual heroes, tower silhouettes, logos, interfaces, maps or textures. Preserve our own blue-roofed Fenwall keep, golden/blue Warden, red raider factions, copper bolts, ten-pad road layout and game systems.

## Positive shape language — deliberately 3D
- **Sculpted storybook geometry:** large head/helmet and hands relative to torso, expressive hats/capes/weapons, tapered tower bodies, thick beveled timber, oversized door arches, hand-carved stone courses. The exaggeration must exist in **3D meshes** and be visible from the gameplay camera.
- **Illustration brought into 3D:** visually intentional outlines and broad painted material blocks; gradient/ramp lighting and subtle curvature; warm sunlit tops, cool, legible undersides, soft cast/contact shadows; controlled edge highlights, not physically literal roughness and specular glare everywhere.
- **Dense where meaningful, quiet where needed:** foliage, flowers, cozy props and river splashes frame the playfield, not obscure the winding lane or drown out enemies. Gameplay first; road, Warden, raiders, towers, keep are the main focal layers.
- **Exaggeration communicates mechanics:** tiny quick Runner with long sweeping scarf and high cadence; narrow Scrapper spear; broad shield character; chunky heavy enemies. Every one must remain distinguishable at 320px-wide portrait and 800px landscape screenshots, including in silhouette/no-color tests.
- **Effects that communicate impacts:** wide-screen-visible copper bolt, starburst and recoil/damage flash within a few fixed ticks, sparing dust at foot contacts, movement arcs and satisfying anticipation/follow-through. Bright VFX should be purpose-driven and short, not constant bloom/confetti.
- **UI with hand-built fantasy charm:** flat illustrated frames and parchment/wood/stone accents with chunky clean labels and thick friendly icons, rather than pseudo-realistic metallic luxury trim, massive dark chrome, jewel currency counters or shiny casino-style upgrades. Keep HUD subordinate to the battle.

## Anti-target — reject on sight
Do NOT drift toward **Rise of Kingdoms-like realistic proportions, luxury gold-plated HUD chrome, ultra-detailed stone-wall microtexture, ornate heraldic gradients, hyper-realistic god rays, depth-of-field-heavy advertising renders, excessively small figures** or a muted photoreal color grade.

Also reject the opposite failure: **flat unshaded polygons, flat grass slab, sparse toy cones, unreadably tiny figures and purely engineering-style map composition**. The existing renderer supports real 3D, but its present art must be raised dramatically above that baseline.

Avoid direct imitation of Kingdom Rush sprites and signature iconography. The target is its **friendly illustrated clarity and movement energy** translated to original, fully authored 3D content.

## Screen-space visual hierarchy
1. Warden / attacking raid / shots and hit feedback (visually legible at native gameplay zoom)
2. Tower / pad decision affordances, action or danger telegraph
3. Road curvature, clean walkable space and key entrance/core relationship
4. Keep, river and attractive scenery framing
5. UI as a crisp, limited contextual overlay

Don't fill the screen with the keep or overwhelm it with tall battlements. Camera should keep Warden and threatened road section together as often as possible. In portrait, reserve safe touch-control and HUD regions without shrinking the battlefield to a tiny inset.

## Visual-composition targets — without locking rendering technology
| Component | Target |
|---|---|
| Character silhouette | Expressive, easy to name from an isolated shadow at ~20–40px |
| Geometry | Real 3D thickness + intentional shape hierarchy, not 2D billboard impostors for bodies |
| Colors | Saturated, playful, clear blue/gold vs red; warm ochre road, lush graded greenery |
| Lighting | Soft afternoon key, cooler bounce, contact shadows and friendly shape definition |
| Materials | Hand-painted-like broad variation and gentle edge separation, no noisy photo PBR |
| Camera | 3D orthographic/near-orthographic action framing, decisive depth and road readability |
| Animation | Real articulated anticipation/contact/recovery, differentiated run cycles; no rigid bob advertised as a walk |
| Effects | Brief purposeful particles, bold impact shapes, clear 3D ballistic hits |
| HUD | Small, chunky fantasy-illustrated UI with readable values, no luxury strategy UI chrome |
| Quality | Must compare runtime frames against the *new original* visual studies and explain every visible deficit |

## Additional clarity, authenticity and motion gates — new requirement

- **Sharp real 3D pixels:** test actual WebGL drawing buffer in native CSS × device DPR × bounded quality tier; no CSS-upscaled blurry 720p gameplay. Keep anti-alias edges crisp without temporal smear, especially under motion.
- **Art quality is independent of resolution:** authored, coherent sculptural geometry, painted material hierarchy, environmental depth, rich yet readable battle composition. A 4K polygon cone or an enormous generic gray build pad still fails.
- **Fluidity is measured in sequences:** contact/foot plants, articulated attacks, readable anticipation/impact/recovery, smoothly eased camera, independent enemy motion and visual response tied to real simulation. Inspect dynamic frames, not only one attractive still.
- **Real visual proof:** 16:9 and 9:16 actual gameplay before/after frames at controlled camera/seed/tick, including viewport, CSS/backbuffer pixels, DPR, graphics tier, commit and screenshot artifact. Actual phone FPS is distinct from desktop SwiftShader testing.
- **No fake polish:** heavy bloom, DOF, blurry filters, glossy metallic fantasy ads or copied third-party visual assets do not satisfy this original playful 3D target.


## Quality gates on EVERY visible task
1. **Reference**: consult this document, `docs/03_ART_AND_ANIMATION_BIBLE.md` and `docs/visual-references/README.md` **before designing**.
2. **Evidence**: capture both a real 16:9 gameplay screenshot and a real portrait 9:16 screenshot at a consistent scene/time/state. Do not pass a concept rendering off as proof of actual engine quality.
3. **Critical review**: at normal displayed size rate silhouette, painted-material richness, depth/shadows, animation readability, lane visibility, HUD economy and general coherence separately. Write the gaps down.
4. **Motion**: verify feet and contact, meaningful anticipation/impact/recovery, no sliding, independent enemies not lockstep. Record tested frame-rate/device; desktop Chrome SwiftShader does **not** prove mobile performance.
5. **Implementation**: no copied copyrighted visual assets; source mesh/material/animation can be built and traced. Compare against own saved art mockups, not third-party image files in public repo.
6. **No premature claims**: passing build/tests and visually appealing generated mockups do not prove finished commercial-quality runtime art.

## Roadmap for raising the current implementation
- **Immediately**: make F3.04 etc meet this style rather than accumulating temporary flat placeholders.
- **Next art sprint**: sculpt higher-quality Warden + Scrapper/Runner proportions, actual 7–12-part articulated motion, exaggerated recoil and readable projectile staging.
- **Environment polish**: replace schematic tree/grass/keep forms with shaped storybook clusters, rich but controlled material ramps, stone/timber trim and stronger contact with the land; maintain path/pad exclusions.
- **Renderer polish**: VQ.01 native-DPI game view passed verified Chrome. VQ.03 will evaluate crisp outlines, toon/painterly ramps, contact shadow and AA without indiscriminate blur/DOF/bloom, subject to measured performance.
- **UI**: rebuild the sparse engineering HUD as a joyful illustrated fantasy presentation with scalable touch-first hierarchy while keeping exact balance data.

## Source/copyright boundary
The generated visual boards are *original exploratory mockups*, not screenshots of the implemented game and not production-ready assets. They are inspired by generalized visual language, not a promise of copyright clearance, trademark rights, or non-infringement; artists must create independent final art. The source inspiration is discussed here in words, **without committing any third-party game screenshot or borrowed sprite**. Keep output branding **Bastionfall** only.
