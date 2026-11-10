# Procedural Art / Animation Direction — enforceable production bible

**2026-11-10 PROFESSIONAL ASSET-PIPELINE OVERRIDE:** The user-supplied [master production directive](00_MASTER_PRODUCTION_DIRECTIVE.md) and [asset-first migration decision](23_ASSET_FIRST_THREE_MIGRATION_ADR.md) supersede earlier primitive-only, flat-material, texture-free, or anti-PBR restrictions wherever they artificially cap visual fidelity. Favor properly licensed **authored GLB/glTF textured characters and environment assets**, sculpted cartoon silhouettes, skeletal motion, advanced material maps, light ramps and tasteful selective post effects with real mobile budgets. Do not mistake mere availability of an external model for style quality: it must fit the illustrated, Kingdom-Rush-inspired **original three-dimensional** look. Keep authentic game scale, collision, gameplay readability, safety and verified performance, and treat older procedural specifications as reference implementations rather than art-production ceilings.

**CURRENT USER ART-DIRECTION OVERRIDE (2026-11-10):** Before interpreting any older specification below, read [`20_VISUAL_NORTH_STAR.md`](20_VISUAL_NORTH_STAR.md) and [`visual-references/README.md`](visual-references/README.md). The desired game is an **original, fully 3D storybook-cartoon tower defense with the playful readability and personality associated with Kingdom Rush**, emphatically **not** glossy/realistic Rise of Kingdoms aesthetics. These are abstract quality references, not copyrighted asset sources. Existing measured world/animation and semantic gameplay contracts still apply; older muted/understated stylistic instructions yield to the newer user decision. Generated concept art remains an artistic TARGET, not actual engine output.

**The game must be visually authored, including when models are imported, refined, rigged, optimized, or produced procedurally.** Procedural does not mean random. It means stable parameterized construction from a documented visual grammar.

## 1. Visual identity
A **sculpted, chunky, hand-illustrated fantasy miniature with fully 3D geometry**, viewed from an elevated orthographic camera; readable from screenshots as narrow as 320px portrait and at 800px landscape. Rounded and faceted forms must cooperate: deliberate broad cartoon color planes, thick but controlled 3D edges, friendly expressive silhouettes, contact shadows and high-energy animated roles. Never imitate actual copyrighted Kingdom Rush characters, icons or Kingshot assets, and never ship generic polygon soup or a glossy realistic kingdom-advertisement render. Every object must occupy a concrete semantic class and possess dimensions, silhouette, material palette, animation grammar and world placement constraints.

Three scales: terrain broad quiet plane → architecture distinct midscale masses → fighters typically **20–40px** high at the default camera zoom (or tested equivalent that preserves face/weapon role silhouette); older 10px targets are no longer adequate for the desired lively readability. Visual hierarchy favors threats and build choices over scenery. Detail only where screen area supports recognition.

## 2. Palette (sRGB hex source of truth)
All colored geometry gets named semantic material tokens. Never random hue generation. Warm afternoon light and cool shadows with **rich, lively cartoon saturation and intentional painted brightness ramps**. The existing hex tokens are the current engine baseline, **not an upper bound on future illustrated color richness**; palette updates must be versioned, contrast-tested and consistent across objects rather than random hue jitter. Use ±4% local material variation initially, and upgrade by authored shade masks/ramps when performance permits.

| Token | RGB | Usage |
|---|---|---|
| grass.primary | #63976B | meadow top |
| grass.shadow | #497555 | slopes / sparse shade |
| grass.dry | #A0A770 | worn margins |
| road.primary | #D7BF91 | paved dirt road |
| road.rut | #B89A6B | wagon-ruts and abrasion |
| earth.cut | #816E58 | cliffs cut / exposed earth |
| stone.base | #7E898C | foundation, turret stone |
| stone.shadow | #57656B | lower courses |
| stone.highlight | #A8AEAC | dry edges |
| timber.base | #73533F | tower beams / gates |
| timber.light | #A27A4D | exposed sunlit face |
| defender.blue | #466D88 | friendly banners and roofs |
| defender.gold | #D8B459 | warden mantle, trim |
| enemy.red | #AA473A | hostile cloth |
| enemy.dark | #673D39 | armor/helm shadows |
| metal | #78868D | spearhead, tower fittings |
| copper | #D9A34B | pickup disks and costs |
| accent.warning | #D77750 | warning/telegraph only |
| ink | #243338 | primary HUD text |
| ivory | #F3E8CE | high-priority HUD numbers |
| water | #6B9AA1 | river (no photoreal reflections) |

In display: red enemies must remain discernible against green terrain for common color-vision deficiencies via helmets/weapons and predictable movement. Avoid maximal red-green contrast dependence. Per scene large-area hues: grass 55–65%, path 12–18%, terrain edge 8–14%, actors/buildings/ui remaining. These are compositional targets, not pixel-perfect requirements.

## 3. Readability prohibitions (not bans on professional graphics tooling)
Avoid indiscriminate bloom, chromatic aberration, noisy film grain, exaggerated vignettes, high-frequency texture tiling, fog obscuring combat, heavy depth-of-field, unmotivated glow, meaningless logos, decorative glyph soup, multicolor confetti, or enormous glossy strategy-game buttons. **Well-calibrated PBR, material textures, SSAO/contact shadow, tone mapping, color grading and selective bloom are permitted when they measurably improve the original illustrated 3D look and can run reliably on target devices.** Do not pull copyrighted ad stills, Kingshot assets, icons or characters. **Important visible gameplay assets may originate from verified CC0/appropriately licensed glTF models with a pinned source and checksum, together with independent commissioned/generated original art; parametric generators remain for terrain, collision and intentional repetition.**

## 4. Geometry generation grammar
Units: meters. All assets share flat-shaded indexed mesh contract with vertex positions, normal, material index and bounding volume. No procedural mesh may allocate new GPU buffers every frame. Meshes built once per seed+archetype, cached by canonical hash; variations use instance transform and material uniform. Geometry need not pretend to be photo-real.

**Terrain:** 8×8m tiles stitched crack-free with common height samples; quads triangulated consistently; max height delta 0.65m over adjacent 1m segment outside cliffs; slope colors use normal+palette, no texture atlas initially. Coast and cliff rims are low-poly extruded skirts (1–4m high) with broad rock facets. Meshes must share vertices or stable normals at seams.

**Road:** sample one cubic spline at ≤0.7m arc-length, offset edges ±2.25m; miter limit 1.35× width; join with bevel where curvature turns sharply. Use earcut for terminal junction caps / optional fork polygons, not for a normal road quad strip. Path slightly raised 0.02m to avoid z-fighting; longitudinal ruts appear ≤1 per 3m and change earth token only. Road is always visibly traversable and not covered by props.

**Trees:** conical / broadleaf archetypes with trunks 0.18–0.33m radius, heights 2.6–5.8m; foliage volumes are 2–4 non-overlapping faceted ellipsoids, not stacks of arbitrary jagged spheres. Each type has at most 3 shades. Tree shadows are soft ellipse impostors; leafy crowns must not occlude hero/main road. Exclusion zones: 3.5m from road edge, 2.5m from build pad, 4m from core.

**Rocks:** 8–20 vertices/facet-group chunks, anchored at ground, orientation constrained to slopes; clusters of 2–4 use coherent local stone palette. Pebble instances below 5 screen px should disappear, not sparkle.

**Grass:** 2–3 intersecting triangular blades per clump; placement via seeded Poisson sampling, density decreases near lane/pads; 1 GPU instance batch per material. No grass collision. Far clusters use flat color patches rather than thousands of visible blades.

**Flowers:** sparse, 0.5–1% meadow area; geometry tiny 2-face corolla with warm ivory color. Not randomly rainbow. No cherry blossom particles outside biome.

**Core keep:** 7×7m footprint, base stone plinth + 4 squared buttresses + navy/slate pitched roof, recognizable vertical gate arch at road exit, one pennant. Height 6.5m. Tier improvements extend physical geometry; never merely enlarge icons.

**Build pads:** octagonal gray cobblestone foundations (radius 1.8m, bevel 0.12m); simple four-corner engraved notches; low outline when targeted; dashed ring in perspective as actual geometry. Empty pads do not glow perpetually.

**Bolt spire:** stone column H 3.5m + timber weapon yoke, horizontal dual arms, clear firing axis and tiny swiveling cap; T2 adds second inset buttress and blue sash; T3 adds metal double-barrel crossbow assembly.

**Arrow rack:** elevated timber scaffold H 3m with 3 visible notch slots; T2 extra roof eave, T3 asymmetrical pennant + fourth slot.

**Lobber:** low stone pit + curved launching arm; silhouette broad horizontal counterweight; T2 reinforced rim, T3 double bracing and brass eye.

**Signal ward:** tall forked wooden signal + suspended triangular blue cloth, almost no weapon-like silhouette; expanding dusty blue ring every 3s and tether to buffed towers **only on inspect**, not permanent magic aura.

## 5. Character construction and silhouettes
Base humanoid proportions (stylized not realistic): 1.7m high; head sphere/cube-bevel radius 0.29m, torso tapered barrel 0.65m tall, hips 0.24m, arms 0.48m, legs 0.62m. Total legibility at 16px height more important than anatomical fidelity. Faces need **expressive but extremely economical original shape language**: brows/eye slits or simple large shapes can be authored when they remain legible in actual screenshot scales; do not add tiny high-frequency details that become speckle at zoom. Helmet, scarf, gear, oversized hands and body inclination still carry the role even in silhouette.

**Hero warden:** blue hood, mustard/gold cloak shaped as 4-triangle tapered mantle, off-center bolt launcher. Torso warm gray. Hero needs a bright gold head/shoulder accent distinct from friendly tower blue roofs. Swaying mantle is 2-part rigid animation; not cloth simulation.

**Scrapper:** red wedge hood + narrow upright spear, 1.65m tall, hips narrow; running silhouette vertical.
**Runner:** lean torso angle + elongated triangular trailing red scarf, visually narrower and lower; 1.55m.
**Shieldbearer:** broad dark kite shield offset front; 1.65m, total frontal width 1.25m.
**Sapper:** rust-orange rigid cylinder pack with short fuse, legs visible; 1.6m.
**Banner:** narrow dark cloth on 2.4m pole with split end, raised over crowd.
**Behemoth:** 3.8m, wide 2.5m shoulder structure, grounded double-handed hammer; lower saturation than small enemies; armor with broad planes, not random spikes.

**Do not use** the blue-gold crowned Kingshot hero silhouette, logos or exact tower models. This spec makes an independent IP.

## 5A. User-approved cartoon proportion and material targets
- Preserve each unit's unique role at native screen size: widen Warden's hood/weapon, taper fast Runner body + push trailing scarf, show Scrapper's thrust and weight, emphasize shield/heavy shapes.
- Build **real 3D silhouettes and face planes** rather than flat card sprites. Use broad clean painted color blocks and restrained outlines or ramps to separate shapes.
- Replace same-sized generic faceted parts with intentional asymmetry, chunky big hands/helmets, snappy readable recoil and genuine foot contact. A procedural whole-body bounce is only a placeholder, **not** finished animation.
- Hero/effect hierarchy must lead the eye before the fortress, then the road, then framing trees. The old engineering map is a negative reference for final art quality; the previous glossy AI mockups are also negative references.
- Do not compromise hit collisions, speeds, damage, tower counts or fixed-step determinism to match a concept still. Animation and silhouettes enhance mechanics without inventing gameplay systems.

## 6. Animation grammar with timing contract
All animations use consistent pivot skeletal hierarchy: Root → Hip → Torso → Head; Torso → L/R Shoulder → Arms; Hip → L/R Legs; Weapon attaches to shoulder. Hierarchy data per asset: name, bindTransform, pivots, animation tracks; no runtime bone vertex skinning required for initial release: 7–12 rigid submesh parts with procedural joint rotations and batched materials.

- Hero idle: 2.1s loop, torso bob 0.035m, head turn ≤4°, cape angle ±3°, no breathing overexaggeration.
- Hero run: 0.55s loop at 4.2m/s, contralateral legs ±32°, arms ±18°, cape follows speed with 0.1s lag, root bounce 0.07m, foot contacts align to simulation.
- Hero auto-fire: draw-to-release 0.12s; arm recoil ≤14° over 0.18s, no full-body freeze.
- Hero dash: squash height 0.93 then stretch horizontal 1.07, settle 0.12s, short ground streak (≤0.2s) and 1 dust puff.
- Enemy walk: loop 0.68s Scrapper, 0.42s Runner, 1.0s Shield, 0.77s Sapper, 0.72s Banner; amplitude determined by speed; phase seeded per enemy to avoid lockstep.
- Shield front defense: shield snaps +8° in 0.08s on impact; no repeated full-screen flash.
- Sapper plant strike: 0.42s with two-key anticipation → contact → recoil; fuse blink amber only.
- Banner pulse: banner sways 0.7s, ring 0.15s every 2s, no particles perpetually raining.
- Behemoth march: 1.24s; attack 1.0s (0.3 windup, 0.12 hit, 0.58 recovery), red ground telegraph 0.45s before hit, clear safe area.
- Death: 0.22s collapse, 0.12s dissolve into two or three coherent chunks, no ragdoll spaghetti.
- Building construct: starts as slab, rises 0.28m in 0.3s with one dust plume; never grows from zero scale in smooth plastic bounce.
- Coin drop: pop 0.12s, ballistic 0.35s, stable 0.2s, magnetic 0.25s; total overlap no duplicate reward.
- Tower firing: weapon visibly rotates to target at ≤220°/s, recoil 0.08–0.17s, projectile follows real trajectory.
- Camera follow is damped; screen shake only boss 1.5px / 0.09s and reduced-motion bypass.

Interpolation must not alter authoritative state. All gameplay animation is clocked from fixed simulation timestamps, not Date.now wall-clock.

## 7. Effects rules
Projectile: hero pale warm bolt with dark shaft, length screen 6–9px; tower arrow 6–10px. One pulse impact sprite/quads at most 0.12s. Coin: occlusion and depth obey same camera rules as all geometry; groups coalesce. Mortar shell arc simulated with t in [0,1], shadow ellipse below, one dust disk max 1.6m radius at impact lasting 0.35s. Boss strike ground footprint telegraphed flat muted orange in 0.45s, never shocking laser beam. Maximum 120 transient VFX instances on desktop and 60 on mobile; automatic priority-based cull.

## 8. Lighting/rendering
One directional sun angle world (-0.35,-0.8,0.45), lambert diffuse with ambient minimum 0.4, tonal quantization optional ≤3 steps, no PBR pipeline. Sky background flat desaturated #D4DBD2 beyond island. Flat colors with geometrically distinct shadow faces; fake projected contact shadows under characters (one elliptical quad per actor), shadow opacity 0.17–0.29. No initial dynamic shadow maps, SSAO, bloom, particles with 3D soft textures, or WebGPU-only path. Anti-alias with native context MSAA if available and devicePixelRatio cap.

## 9. Typography and UI
Use system UI font stack or tested OFL open-source font, avoid rasterized game fonts until measured. 1 rem = 16 CSS px; target ≥14px top labels at 1080p; cost numbers 18px; primary headings 24px. HUD material: translucent ivory parchment #F3E8CE with 0.92 opacity and charcoal typography, modest 5px corner radii, 1px border #A4A99D. No glassmorphism. Built-price UI anchored to pad screen projection, occlusion fade behind foreground structure. Icons must be authored from minimal original SVG geometry. No emoji, no generic stock assets.

## 10. Performance & art QA gates
At 1920×1080 desktop, 100 live enemies + 20 towers + 300 static props should aim ≤250 draw calls (goal ≤100), 16.7ms average frame budget, ≤120MB combined geometric GPU buffers, <=40MB compressed initial download target (aspirational; measure). Mobile 720p with 75 live enemies: aim ≤33.3ms frame, draw calls ≤120; adaptive scale 0.75–1.0. Every procedural mesh generator needs tests for: deterministic hash, valid indices, finite normals, watertight caps where appropriate, no degenerate triangles, bounds within expected range, no overlap with gameplay corridor. Screenshot-diff review must explicitly check palette, silhouettes, road continuity, core visibility and no obstructive VFX before marking art tasks done.

## 11. Mandatory review checklist for every visual change
- Is the hero identifiable at a glance in 200ms?
- Are enemies distinguishable by role without their names?
- Is the route visible under >70 simultaneous enemies?
- Is every build site recognizable without UI hover?
- Do towers visually match their function and tier?
- Are procedural variations from allowed ranges and deterministic?
- Does a 16:9 and 9:16 capture preserve functionality?
- Are composition and colors governed by this file?
- Does reduced motion preserve combat information?
- Has at least one actual screenshot or browser-render inspection occurred? If no, mark visual QA as **not verified**.
