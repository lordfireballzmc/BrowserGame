# Bastionfall — one authoritative art direction

**ART.LOCK · hand-painted angular fantasy · adopted 2026-11-11.**

The user **rejected both** (1) the current low-poly/smooth runtime game and (2) the old vector `docs/visual-references/target-illustrated-3d-composition.svg`. The exact new target is the **user-supplied painted Fenwall Defended: Tower Clash PNG**. Its supplied painterly blue Warden, sharp crimson raiders, twisted olive-yellow tree, distressed masonry/wood, graphic action marks, muted palette and medieval teal/parchment UI are a unified **non-negotiable production style**, not decorative optional inspiration.

**Read in order:**
1. [Binding visual hard requirements](HARD_REQUIREMENTS.md) — priority, prohibited output, actual-runtime acceptance.
2. [Full 11-section user specification](FENWALL_VISUAL_RECONSTRUCTION_SPEC.md) — the exact original supplied text, including camera/geometry/layout/palette/UI and exhaustive anti-targets.
3. [Reference PNG manifest](REFERENCE_ASSET_MANIFEST.md) — user-uploaded binary filenames, dimensions, exact SHA-256, canonical/negative roles and Git blob verification rule.
4. [Do / do-not style guardrails](STYLE_GUARDRAILS.md) — practical review checklist and palette.
5. [ART.LOCK implementation and cleanup tracker](ART_REPLACEMENT_BACKLOG.md) — actual renderer migration order and non-compliance debt.

## Canonical target — illustrated, not yet current WebGL output

**Primary image filename:** `visual-anchor-handpainted-runtime-target.png` (exact source `Fenwall Defended_ Tower Clash.png`, 1672 × 941). This image must be added as an *original binary PNG* and verified against the SHA-256 manifest; never replace it with a low-resolution redraw, SVG, synthesized placeholder, or URL to a conversation-only attachment. **No false display:** until the original binary exists in GitHub, this README deliberately links to the complete textual spec rather than a broken image.

### Supporting references (original user uploads)

`slices/tree-twisted-canopy-reference.png`, `slices/enemy-raider-reference.png`, `slices/hero-blue-knight-reference.png`, and `slices/asset-family-reference-sheet.png`. All follow the same exact-bytes rule as the main anchor.

### Rejected / anti-target references

`rejection-current-runtime-example.png` and `rejection-old-repository-anchor.png` are explicitly **negative**. A historic review can refer to their original file names, but they are *not* alternative accepted targets.

## Current game quality status: NOT ACCEPTED

The actual game's generic green foliage, smooth toy-like CC0 Warden/raider/tower assets, uniform road and primitive copy-pasted models **fail ART.LOCK**. Earlier technical milestones (native DPR, wave scripts, physics, WebGL2 smoke, bloom, 3D source-asset import, simplified HUD) remain useful *engineering scaffolding only*. They do not certify any current production art family.

Artwork, shaders and game systems must advance together, not reset gameplay. A finished asset must **look painted at gameplay zoom**; the existence of an imported GLB, a procedural wind shader or selectively emissive projectile never replaces authored paint, asymmetry, expressive animation and genuine visual critique.

**No competing anchors:** `docs/20_VISUAL_NORTH_STAR.md` and `docs/visual-references/README.md` redirect here. Historic screen reviews are evidence, not new directives. Future docs and agents must link here instead of maintaining duplicated contradictory art policies.

**Original PNG ingestion gate:** the GitHub connector supports text writes and Git blob base64 but not direct local container path uploads. The original user files have been inspected and hashed; until their exact PNG bytes have been pushed and fetched back as image/png blobs, binary archival is **pending**, not "done". This is a tooling transfer limitation, **not a lack of repository write permission**.
