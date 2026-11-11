# Bastionfall — concise current cross-session handoff

**Effective:** 2026-11-11. Prior long handoffs remain in this file's Git history and permanent per-milestone reviews; they are historical evidence, not active instructions.

## Highest priority: user ART.LOCK decision (NON-NEGOTIABLE)

The user explicitly rejected both the shipped flat/plastic starter-asset visuals and the in-repo vector/SVG art anchor. Required look is a **professionally hand-painted angular fantasy strategy-game scene** with gouache/dry-brush directional strokes, gnarled olive-yellow trees, sculpted worn masonry, ochre roads with broken edges, dark teal layered cliffs, expressive blue knight and crimson hooded goblins, subtly imperfect medieval parchment UI, restrained illustrative orange/cyan effects and a 35–45° isometric camera. No glossy PBR, procedural foliage spam, generic low-poly assets or bloom passed off as a painterly look.

**Single source of truth:** `docs/art-direction/README.md`; hard gate `HARD_REQUIREMENTS.md`; verbatim uploaded brief `FENWALL_VISUAL_RECONSTRUCTION_SPEC.md`; exact original user PNG hashes `REFERENCE_ASSET_MANIFEST.md`. The old `docs/visual-references/target-illustrated-3d-composition.svg` and old mockup recipes are rejected and removed from current source. Historical reviews remain browsable in Git history.

**Critical incomplete task:** Upload original seven user PNG binaries to specified paths and prove byte SHA-256 + actual Git blob rendering. Image file names/hashes in prose DO NOT count as binary uploads. Original sources are available from the conversation as uploaded files; a binary-compatible transfer path is required.

## Runtime state vs visual acceptance

**Latest verified foundation:** Full two-wave real 60Hz defense (#36), Three/WebGL2 source-pinned CC0 skinned actors and environment, legitimate physical bolts/tower purchases/kill crowns, native-DPI landscape+portrait game tests, corrected 35.264° forward-facing camera (#38), selective HDR bolt bloom and GPU grass wind (#39), original but still non-painterly stone foundations (#40), collapsible HUD (#42). These are technically useful, **all currently visually NOT APPROVED against ART.LOCK**. Developer can keep rendering fallbacks and mechanical geometry while replacing their appearance with original painted art.

**Open development streams:** third-wave shield mechanics PR #43, impact/recoil PR #37, touch-analog movement proposal. Inspect latest PR status/CI; do not assume they are merged or compatibility-tested with current `main`. Do not merge or prolong noncompliant visual changes as a claimed final solution.

**Known real runtime deficits:** green plastic and cone/sphere foliage, repetitive terrain and ochre road, source-kit tower/masonry/characters, abrupt combat staging, cramped/overscaled victory HUD, weak painterly texture, minimal atmospheric painted cliffs/water, under-developed motion/physics and missing full 10-wave content. User submitted real-game rejection image and fully illustrated accepted target.

## Next actions and proof

1. Source-exact original reference PNG binary ingestion; verified Git files and hashes.
2. Painterly terrain/foliage authored geometry+texture replacement (do not just recolor primitive scene), keeping road/pathing, FPS and touch controls.
3. Painted enemy/hero/towers/keep and graphic FX/UI overhaul with frame-sequence QA.
4. Full authoring of ten-wave game and physical animation/response, on the preserved 60Hz gameplay logic.
5. Exact-head build, unit CI, real Chrome 16:9 +9:16 and genuine mobile GPU when available. Record measured results, compare against approved reference, and report art gaps candidly.

**GitHub Pages NOT verified live.** Repo private; do not change visibility without user authorization. The rejected old anchor remains recoverable from history, not current reference.
