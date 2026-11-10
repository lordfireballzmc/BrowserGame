# Bastionfall visual-review history — cross-chat art memory

This document records the user's **actual taste judgments and acceptance criteria**. A new session must not infer quality merely from the latest code, a passing CI check, or a pleasing but misleading generated concept.

## 2026-11-10 — original screenshot comparison: rejection of flatness
**Input:** user compared the current F2.05 muted/flat seeded-island screenshot with a much richer promotional 3D tower-defense screenshot.  
**Observation:** the repo scene was largely flat and schematic, with weak depth, featureless land, sparse scenery and no readable animated attack. Target reference had close framing, more sculpted buildings/towers, bold faction identities, layered vegetation, pronounced grounding, readable attacks and professional composition.
**Decision then:** increase dimensionality, cast shadows, world/detail richness, visual hierarchy and in-game polish in every iteration. This was the *general visual-quality challenge*, not permission to use the source image/artwork in the game.

## 2026-11-10 — first generated original mockup round: rejected as wrong genre taste
**Input:** three original AI-generated Bastionfall landscape/portrait promo-style mockup experiments, with a large shiny blue-and-gold fortress and lavish polished mobile UI. These are concept experiments, not runtime outputs.
**User correction (explicit and binding):**
> “these graphics are siding too much on the direction of Rise of Kingdoms but i prefer inspiration from Kingdom Rush art style though 3D”

**Why rejected:** despite greater surface detail, the visual impression tilted into realistic miniature-castle strategy advertising: tiny armies, grand scenic kingdom vista, glossy ornate crest/gold HUD and cinematic rather than playful/comic staging. More graphical complexity was **not the same as the right art style**.

## 2026-11-10 — corrected north star: playful 3D illustrated tower defense
**Decision:** preserve Bastionfall's own setting, factions, keep, original enemy types and game systems, but change **shape language, lighting, animation and UI** toward friendly expressive, punchy **illustrated cartoon-like 3D**. Use Kingdom Rush only as a shorthand for recognizable cartoon silhouettes, high-density legibility, readable tower combat, charming asymmetry and comic animation timing; never clone its art. Do not imitate Rise of Kingdoms' luxurious realistic strategy-ad look either.

**Positive traits from original concept iteration:** exaggerated hoods and rounded helmets, compact sympathetic Warden, red raiders with visibly different speeds, rich stylized trees and carved keep, approachable clean cliff/water/bridge forms, visible copper arrows and impact stars, smaller parchment/stone/wood UI, warm playful saturated colors and clean outlines over genuine 3D volumes.

**New persistent repository assets (awaiting explicit approval of this particular rendering):**
- `docs/visual-references/target-illustrated-3d-composition.svg` — original version-controlled vector composition guide (art-direction document, **not** actual engine output)
- `docs/20_VISUAL_NORTH_STAR.md` — binding positive and negative visual decisions and screenshot quality gates
- `docs/visual-references/GENERATIVE_MOCKUP_PROMPTS.md` — reproducible recipes for original future AI visuals

**Copyright/source caution:** third-party promo screenshot was discussed for analysis but deliberately not embedded here. The ChatGPT-generated PNG concept sheets from the discussion have not yet been checked in as binary assets; do not claim they are. The vector composition file and generation recipes **are** checked in.

## 2026-11-10 — current engine reality (baseline)
**Code:** as of F3.03 on main, live 3D WebGL2 island, bridge and road, real sun shadow map, two world/scenery batches, Warden keyboard movement, actual deterministic raiders and traveling copper Warden bolts with real hit/damage.
**Evidence:** [GitHub Actions F3.03 run 42798030716](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42798030716): 176 tests, TS, build and real Chrome 16:9/9:16 movement+projectile screenshots. See `docs/19_F3_03_PROJECTILES_REVIEW.md`.
**Still unacceptable visually:** architecture lacks playful sculptural richness, surfaces are too sparse, enemy/warden silhouettes feel simplistic, character movement is mostly whole-body transforms, projectiles are not clearly dramatic at normal gameplay scale, UI retains engineering-test qualities, and the framing needs better attention to approach/keep. This remains **far below** the new illustrated 3D reference, even though the code works.

## 2026-11-10 — first unified Three.js gameplay renderer, still far from art target

**Reviewed actual Chrome screenshots:** [GitHub Actions ART.02 #42824821031](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42824821031), artifact 13769370731; 1500×950 landscape and 900×1200 portrait. All 182 unit tests and existing gameplay browser checks passed. The 3D terrain, 19 raiders, Warden, real bolts and source-verified GLB now occupy one Three.js canvas with shared depth/shadows. No composited GLB overlay.

**Observation:** directional shadows on trees/raiders and scene lighting visibly strengthen spatial cues compared with the earlier flat prototype, while bright saturated grass and warm ochre road make game lanes easily visible. However, meshes remain blocky and simplistic, grey stone pads overly large and bare, facial/weapon silhouettes too weak at mobile scale, landscape/portrait keep partially cropped, and the UI remains diagnostic. Screenshots are captured at different simulation times from the earlier ART.01 reference and are not controlled image-pair quality scores. This is a necessary 3D rendering foundation, **not equivalent to premium cartoon art**.

**Mandatory next art work:** coherent authored stylized hero/enemy/keep GLBs, real 3D skeletal animations, broader painted material variation and close-up frame review. Continue ART.02b map/cinematic parity before deleting the fallback renderer.

## 2026-11-10 — ART.02b unified map and 16:9/9:16 cinematic screenshots

**Source:** real Chrome/SwiftShader CI [#42832578697](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42832578697), screenshot artifact **13772835552**, downloaded and visually reviewed. The full-island map, P01 unlocked and P09 locked pads, posed hero/raiders/bolt spires, and the 702KB CC0 lantern all use a single Three.js color/depth/shadow scene. The lighting has visible directional depth and warm road contrast, and the two compositions retain the main action area.

**Art critique:** still visibly inferior to the mandated storybook 3D fantasy north star: large areas of flat green with repetitive scatter, grey empty octagonal tower pads, stiff red toy-soldier raiders, small unexpressive Warden, basic blue-roof keep and thin environmental decoration. Landscape and portrait cinematic frames display an engineering-page shell above the canvas and can vertically scroll; they are diagnostic screenshots, not polished mobile UI. **No new modeled/rigged character assets or animations were introduced**. 

**Next design priority:** ART.03a coherent original high-quality sculpted 3D silhouettes, textured keep/foliage/tower components and skeletal animation. Do not substitute glossy Rise-of-Kingdoms realism or promotional reference screenshots for actual game art. Full acceptance detail: `docs/26_ART02B_MAP_CINEMATIC_REVIEW.md`.

## Repeatable future review entries
Append one entry per visually meaningful change:
- **Milestone / commit / CI run and screenshot artifact:** exact links; flag unavailable material.
- **View tested:** landscape and portrait size, approximate zoom, camera, actual gameplay state.
- **Positive difference:** specifically what is better and visible in real output.
- **Deficiencies:** at least one honest issue unless visual parity is truly justified.
- **Next art fix:** one bounded actionable task, not a vague wish to “polish.”
- **Approval:** user accepted, user rejected, or not yet reviewed. Do not infer approval from silence.

Do not erase previous rejected visuals or users' negative guidance. This log is the cross-chat record of **what the user means by excellent graphics**.
