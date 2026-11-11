# Bastionfall — original browser tower-defense game

> **ART.LOCK — NEW BINDING USER ART DIRECTION, 2026-11-11:** Every production visual must look **hand-painted, angular and storybook-isometric**, matching the exact user-provided **Fenwall Defended — Tower Clash** painterly reference. **Current game visuals and the former SVG/vector "visual anchor" are explicitly REJECTED.** Consult [the canonical art-direction index](docs/art-direction/README.md), [binding hard requirements](docs/art-direction/HARD_REQUIREMENTS.md), [full verbatim user specification](docs/art-direction/FENWALL_VISUAL_RECONSTRUCTION_SPEC.md), [reference PNG SHA-256 inventory](docs/art-direction/REFERENCE_ASSET_MANIFEST.md) and [real visual-replacement backlog](docs/art-direction/ART_REPLACEMENT_BACKLOG.md) **before any graphics, model, shader or UI work**. Asset names in docs are not binary uploads; exact originals must be ingested and verified separately.

## Actual product and technical state

Bastionfall is a strict-TypeScript / Three.js-WebGL2 browser defense game with deterministic fixed 60Hz movement/physics and real projectile collision, hero and raider logic, physical tower purchases, crowns, HP/core damage and verified two-wave victory/defeat. It has responsive portrait and landscape canvas rendering, true 3/4 orthographic battle camera, starter skeletal GLBs, a CC0 scenery kit, original but still generic sculpted tower foundations, wind and selective HDR effects, plus a compact functional tower dock.

**These are engineering features, NOT acceptance of the current plastic/low-poly visual quality.** The actual runtime must be replaced asset-family by asset-family with painterly 3D geometry, textures, light, silhouettes, animation and medieval UI matching the uploaded reference; an AI image or a green WebGL smoke test is not a production-game makeover.

### Run locally

Requirements: Node.js 22+ and npm.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

Open the Vite URL displayed by the development server. The real playable combat scene is `/tests/terrain-preview.html?view=movement&quality=sharp`. Use `&aspect=portrait` for the 9:16 preview; `&debug=1` for engineering telemetry; `&renderer=legacy` for regression fallback. Existing valid keyboard/tower interactions, source licenses and test evidence are preserved during art migration.

### Development entry points

- [Mandatory development protocol](AGENTS.md)
- [**One active hand-painted visual source of truth**](docs/art-direction/README.md)
- [Current concise cross-session handoff](docs/07_SESSION_STATE.md)
- [Gameplay and art-replacement task backlog](docs/06_EXECUTION_BACKLOG.md)
- [Full design and balance bible](docs/02_GAME_DESIGN_BIBLE.md)
- [Technical architecture](docs/05_ARCHITECTURE.md)
- [Source-pinned licensed component notices](THIRD_PARTY_NOTICES.md)
- [Actual historical screenshot/CI reviews](docs/21_VISUAL_REVIEW_HISTORY.md)
- [Native pixel + 60Hz technical fidelity directive](docs/29_VISUAL_FIDELITY_AND_FLUIDITY_DIRECTIVE.md), subordinate to ART.LOCK for **art style only**

### Source / ethics / status

All external source assets must have correct license and revision provenance; third-party game imagery is not an asset source. User-supplied original painterly reference PNGs are **art direction references**, not pre-built skinned game meshes. Keep the game original.

GitHub Pages public publishing has **not** been confirmed live; do not report its URL as deployed until configured and independently HTTP/browser-verified. The repository remains private. Historical review docs and Git commits remain in source history, but the rejected old SVG and pre-ART.LOCK mockup prompts must not return as active targets.

**Near-term tasks:** ingest exact original PNGs into Git, replace low-poly environment and foliage with genuinely hand-painted original art, then hero/goblin/towers/keep/UI, test readable animations and mobile performance, and build the full ten-wave campaign without sacrificing actual gameplay.
