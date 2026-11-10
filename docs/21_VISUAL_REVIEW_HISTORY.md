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

## 2026-11-10 — ART.03a actual licensed 3D rigs: better motion, worse faction colors until corrected

**Screenshot source:** ART.03a genuine Chrome/SwiftShader [#42838208953](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42838208953), 1500×950 landscape and 900×1200 portrait rigged Warden movement/19 raiders/physical 4-bolt-hit scene; artifact **13773974295** downloaded and independently inspected. Also map P01/P09 and both static cinematic compositions; **187 Vitest** and TypeScript/build green.

**What improved:** real skinned 3D artist-sculpted head/helmet, torso, limbs, weapons and hooded characters; five authentic authored movement/death/attack clips per role, local custom instantiation with world-sampled animation time. The interaction still follows the actual road; magic projectiles remain real moving bodies. This is materially different from the previous single rigid whole-body mesh bob.

**What regressed:** the original CC0 pack rendered its mostly neutral/silver Knight and brown/green Raider/Rogue atlas colors. At actual gameplay scale the enemy corps read brown/green rather than **crimson hostile**, and the Warden read gray/silver instead of **blue/gold defender**. This contradicted the user's explicit visual hierarchy. The branch's first base-material tint **did not fix the problem in the final screenshots**: multiplying color into a green/brown atlas cannot create unavailable red/blue channels. A second correction remaps each fragment's *sampled texture luminance* into blue-and-warm-gold Warden versus crimson/ruby hostiles, using an inexpensive Three MeshStandardMaterial shader injection and role-distinct cache keys. **Fresh actual screenshots have now been verified:** [CI #42846937678](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42846937678), artifact **13779526047**, both landscape/portrait. Warden reads pale/saturated blue, raiders coral red and bright pink—much clearer than prior gray/brown/green. However the repaint also flattens original cloth, metal, skin and accessory hues into near monochromatic character families; **this is readable, not professionally art-directed**. In ART.03b create two-tone painted atlas sections (blue/gold Warden armor, richer deep-red raiders, contrast faces/metal/copper), and ensure independent visual review. Do not claim earlier images reflect later code.

**Still weak regardless of palette:** Warden and enemies are small in wide battlefield composition, the battle UI is diagnostic, tree/rock art is repetitive, 10 tower pads are empty industrial disks, and the foreground keep is still a flat blue-roof block. This CC0 silhouette family is a professional rig foundation, **not** a unique finished Bastionfall faction kit. Next: custom blue/gold armor, red exaggerated Raiders, readable hero projectile/weapon attachment, real foot plants/recoil and mobile profiling.

## 2026-11-10 — ART.03b eight-part costumes and original equipped weapons (first in-game art review)

**Sources:** Source-pinned original KayKit GLB node-name inspection, [CI #42850500809](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42850500809), screenshot artifact 13780501277, actual landscape gameplay, portrait gameplay and landscape/portrait static cinematic frames, downloaded and inspected. First script passed 192 tests / 23 test files, strict TS/build, one Three.js world with 19 marching raiders, 20 skinned actors and physical copper hits. This is real engine output, **not** an AI art mockup.

**Positive:** compared with ART.03a's homogeneous color fill, separate authored mesh parts now have armor, capes, helmets/hoods, skin and metallic hand-socket weapons with their own painterly 3D shading. Only one sword + badge shield for Warden, one axe + round shield for Scrapper and one small crossbow + knife for Runner remain visible; overlapping unused source alternatives no longer spoil silhouettes. Smooth 140ms authored bone-pose transitions use fixed simulation seconds.

**Critical first screenshot finding:** at tiny action-camera size, Warden mostly reads **gold** because all helmet metal was gilded, rather than **blue with gold accents**; several raiders read **brown** because dark hat + tan face dominate more than crimson jackets. An immediate palette revision makes the helmet BLUE and raises red saturation across hats, cape and body. **Revised palette now passed an independent actual browser screenshot gate:** final source revision `04273407668a772afeadf7fff892dd5239d33b13`, [Actions #42852540671](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42852540671), screenshot artifact **13781018146**, downloaded and inspected both landscape and portrait. Warden now reads visibly blue with modest gold armor/shield/weapon accents; both enemy classes read vibrant red/wine rather than brown. **This is an internally verified material/readability improvement, not user signoff.** Character size and silhouettes remain closer to generic CC0 miniatures than bespoke exaggerated Bastionfall figures; environment/pads/UI still flat and unfinished.

**Next:** visual gate on corrected screenshot, then ART.03c original stylized keep, sculpted tower pads, foliage, richer road edges and native mobile performance. See `docs/28_ART03B_CHARACTER_IDENTITY_REVIEW.md`.

## 2026-11-10 — pre-implementation resolution/visual mandate (historical; superseded by later VQ.01 verified review)

**New user requirement:** implement the real technical and artistic improvements needed so that Bastionfall is sharp rather than blurry, deliberately sculpted rather than primitive, and alive with professional animation rather than stiff movement. Highest-quality achievable original illustrated 3D remains the style, with no glossy strategy-realism. [New binding directive](29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md) centralizes future execution/acceptance and updates agent prompt, backlog, architecture, source-policy and README.

**Known rendering limitation:** active movement preview still sets 1280×720 backing pixels in landscape (720×1280 portrait). Existing CSS/DPR graphics utility is not connected to that gameplay path. High-DPI rendering is therefore **pending VQ.01 code**, not proven by documentation. Next VQ.02+ original keep/pads/environment, material finish, true motion and actual screenshot/sequence comparisons; continue F3.04 economics. Preserve this historical record of user objections. **No new screenshot, runtime improvement or mobile FPS verification was produced by this documentation-only policy update.**


## 2026-11-10 — VQ.01 completed, art improvements still needed
Real [DPR2 screenshots](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42888985727/artifacts/13796194576) and [green CI](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42888985727) verify responsive physical 2400×1350 landscape and 1350×2400 portrait Sharp buffers, real gameplay and quality/resize roundtrips. Positive: crisp rendering; negative: blank octagonal pads, flat grass, repetitive angular vegetation, simplistic keep/HUD. User has not signed off on artistic quality; no real mobile FPS. [Detailed review](30_VQ01_NATIVE_DPI_BROWSER_REVIEW.md). Next VQ.02 original premium environment kit.

## 2026-11-10 — VQ.02a verified artist-authored castle art A/B, professional standard still open

**Exact evidence:** [PR #31](https://github.com/lordfireballzmc/BrowserGame/pull/31), [CI #42898990215](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42898990215) **196 tests**, [production browser #42898990265](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42898990265), [real landscape/portrait before-after browser artifact #13802696387](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42898990215/artifacts/13802696387). [Critical reviewed comparison](32_VQ02A_KENNEY_CASTLE_ART_REVIEW.md). All 6 artist-authored CC0 Kenney glTF GLBs and 39 physical castle/ten-pad placements load in the same Three scene; real Warden combat and P01/P09 remain intact. **Genuine improvement:** original ugly gray pads become sculpted gold/blue layered stone foundations; central blue-roof Fenwall building gains windowed side turrets. **Still unacceptable:** this is generic non-exclusive Kenney low-poly kit art, sparse grass and trees, partly cropped keep, plain diagnostics HUD, motion/gameplay completeness unresolved. Not public Pages deployment, not user signoff, no mobile GPU FPS. **Next:** VQ.02b more distinctive stylized environment and F3.04 economy.

## 2026-11-10 — VQ.02b verified 3D KayKit forest in real gameplay

[PR #32](https://github.com/lordfireballzmc/BrowserGame/pull/32), [full green CI #42919159127](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42919159127) (**199 tests**), [actual 16:9 + 9:16 before-after real browser screenshots](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42919159127/artifacts/13811127137), [production browser #42919159021](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42919159021). [Full honest art review](33_VQ02B_KAYKIT_FOREST_ART_REVIEW.md). *Source-selection history:* rejected technically working 7 simple Kenney model prototypes after real A/B graphics review, replaced with ONE 396KB KayKit Forest Nature CC0 GLB shared gradient atlas with 7 distinct source meshes, 40 trees+42 rocks as 7 Three GPU batches, unchanged 258 scenery placements and combat/pad clearances. **Improved:** fuller, more characterful tree silhouettes; richer greens and ground shadow. **Still poor:** prominent rock sources look like layered machinery, sparse flat grass, keep clipped in portrait, simplistic UI and insufficient motion. No mobile GPU FPS, exclusive sculpting, user approval or public Pages activation. **NEXT:** VQ.02c organic rocks/ground/foliage and F3.04 playable economy.


## Repeatable future review entries
Append one entry per visually meaningful change:
- **Milestone / commit / CI run and screenshot artifact:** exact links; flag unavailable material.
- **View tested:** landscape and portrait size, approximate zoom, camera, actual gameplay state.
- **Positive difference:** specifically what is better and visible in real output.
- **Deficiencies:** at least one honest issue unless visual parity is truly justified.
- **Next art fix:** one bounded actionable task, not a vague wish to “polish.”
- **Approval:** user accepted, user rejected, or not yet reviewed. Do not infer approval from silence.

Do not erase previous rejected visuals or users' negative guidance. This log is the cross-chat record of **what the user means by excellent graphics**.
