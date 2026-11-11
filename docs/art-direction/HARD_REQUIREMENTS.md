# Bastionfall ART.LOCK — mandatory hand-painted production standard

**Authority:** Explicit user directive, 2026-11-11. **Status:** BINDING, overrides every older art target in this repository. This is a hard acceptance gate, not a mood-board suggestion, optional polish sprint, or authorization to ship an engineering prototype as finished art.

## The one canonical visual identity

Bastionfall must resemble the user-provided **Fenwall Defended — Tower Clash** painted battlefield. Every shipped or newly produced **environment, terrain, road, cliff, water, bridge, plant, tree, flower, stone, tower, hero, enemy, prop, projectile, impact, shadow treatment, UI frame, button, icon, font treatment and motion effect** must share its **hand-painted, angular, worn, tactile storybook strategy-game** style.

The complete unabridged user specification is [FENWALL_VISUAL_RECONSTRUCTION_SPEC.md](FENWALL_VISUAL_RECONSTRUCTION_SPEC.md); exact original asset identity and SHA-256 are documented in [REFERENCE_ASSET_MANIFEST.md](REFERENCE_ASSET_MANIFEST.md). Use these references together. A visually pleasing isolated 3D model is **not** sufficient if it disrupts the composed painterly world.

The submitted examples are **reference/aspiration, not proof of current runtime quality**. The current real-browser screenshot, the former vector/SVG anchor, generic KayKit/Kenney models, smooth glTF skins, green plastic canopies, smooth gray slate towers and flattened tan terrain are explicitly **REJECTED AS FINAL ART**. Legacy and starter assets may remain **strictly labeled engineering placeholders** during staged migration, never approved as polished Bastionfall content.

**Priorities when requirements conflict:** (1) this latest user art decision; (2) the complete supplied reconstruction specification and uploaded original visual reference assets; (3) legible, correct and responsive real-game simulation; (4) measured device performance; (5) historic art/design docs. Older suggestions of rounded toy-style models, glossy "UE5", cheerful flat vectors, PBR shininess and bloom as substitutes for paint are superseded.

## Mandatory visual properties

- **Illustrated surfaces:** visible directional dry-brush/gouache marks and irregular pigments across wood, stone, foliage, fabric, ground, cliffs and backdrop; no uniform flat albedo, glossy specular, plastic gradients, stock atlas look or procedurally repetitive vegetation.
- **Silhouettes:** hand-shaped, angular/asymmetric planes; crooked torsos and limbs where appropriate; rugged big-headed expressive blue-cloaked defender, brick-crimson hooded goblin raiders, stout weathered ballista/fire/crystal towers, twisting gnarled olive-yellow tree; no spherical green trees, cone forests, generic interchangeable tower columns or toy miniatures.
- **Color:** olive/mustard/yellow-ochre nature, warm sandstone highlights, cool teal shadows, parchment-gold UI; accent blue, crimson, orange and crystal cyan restrained by the supplied palette and readable scene hierarchy.
- **Scene:** 35–45° elevated three-quarter isometric; 16:9 full composition as the primary target plus genuinely recomposed 9:16 mobile viewport, not a crop. Natural irregular landscape boundaries, shaded stone banks, painterly water/bridge, wide winding sandy lane, visually legible melee, negative space and depth.
- **Illustrated light and effects:** broadly painted warm/cool light planes and graphic contact shadows; sparing orange impact starbursts, strokes and narrow spell trails. NO blanket bloom, neon haze, optical blur, plastic gloss, excessive rim light, photoreal fog or cinematic filmic filters. A shader is not a replacement for source paintwork.
- **UI:** illustrated medieval teal/parchment panels with subtly broken hand-painted edges, balanced typography, meaningful faction iconography and playable touch-safe controls; no generic CSS pill dashboard, massive engineering overlays, casino-gold ornament or arbitrary decorative symbols.
- **Motion and physics:** preserve real 60Hz simulation ownership, projectile collision and reactions. Render fluid anticipation/contact/recovery, foot support, recoil and purposeful animated foliage with time-coherent pose changes; no static screenshots passed off as motion quality.

## Release gate — cannot claim ART.LOCK success without evidence

1. Identify the exact reference PNG name, commit blob SHA and original SHA-256 in the asset manifest. Never claim an image is in Git when only uploaded to chat or named in prose.
2. Capture **actual live WebGL** at controlled seed, wave state, tick, camera and quality in both 16:9 and 9:16, with visible real hero/enemies/towers and unblocked gameplay; **not** pasted artwork, photobashed marketing stills or static concept cards.
3. Inspect at gameplay size AND 100%-scale crops: silhouettes, paint texture/material breakup, surface value grouping, directional brush patterns, grounded shapes, dynamic shadows, foliage/road/water richness, combat staging and HUD hierarchy against the exact attached canonical anchor.
4. Test animation/interaction in **sequences** and real controls; list remaining deficiencies. Green TypeScript, 200+ tests, GLB counts, DPR, bloom settings or a screenshot are NOT aesthetic acceptance.
5. Verify UI, collision, enemy direction, pad purchases, pause, defeat/restart and core/hero damage remain actual gameplay. A gorgeous concept frame that replaces functional play is a failure.
6. Record exact-head tests/Chrome evidence, drawn and CPU/GPU cost where measured, and a **human art judgment**. Do not invent performance numbers or label SwiftShader as phone FPS.
7. Mark visual PRs **NONCOMPLIANT / PARTIAL / ACCEPTED** explicitly; no silent temporary-to-shipped promotion. New source assets require provenance/license records and a paint-language checklist.

## Conflict and cleanup policy

The old vector `docs/visual-references/target-illustrated-3d-composition.svg` is **rejected** and must never be linked as active north star. The old prompts, generic CC0 materials and early screenshot reviews document historical attempts only. Do not follow them as active product decisions. Keep correct gameplay tests, useful legacy renderer probes, original legal notices, and authoritative 60Hz simulation. Delete/replace visual bloat only after verifying it is genuinely redundant; do not mass-delete live assets, CI or game history to create false cleanliness.

**Immediate work order:** ship the complete exact reference PNG set into `docs/art-direction/` (not screenshots of screenshots), replace runtime foliage/terrain first, then original character and tower assets, painted effects/lighting and UI, then motion and feel refinements, with browser acceptance after each coherent pass. **As of this directive, current runtime visuals are NOT accepted.**
