# Bastionfall — mandatory agent/developer protocol

## ART.LOCK: Latest explicit user directive (2026-11-11) — HIGHEST PRECEDENCE

**ALL production visuals/assets MUST match the user's hand-painted, angular painterly Fenwall Defended style.** The current primitive/plastic/glossy runtime, rejected vector mockup and previous "cheerful 3D cartoon" directives **are not approved art**. No rounded green-ball trees, flat roads, toy/clay characters, generic source-kit towers, unpainted polygons or arbitrary bloom should ever be described as accepted final game visuals.

**READ FIRST:** [docs/art-direction/README.md](docs/art-direction/README.md) → [HARD_REQUIREMENTS.md](docs/art-direction/HARD_REQUIREMENTS.md) → [full exact user reconstruction specification](docs/art-direction/FENWALL_VISUAL_RECONSTRUCTION_SPEC.md) → [reference-image manifest](docs/art-direction/REFERENCE_ASSET_MANIFEST.md) → [paint-style guardrails](docs/art-direction/STYLE_GUARDRAILS.md).

The user provided the exact painterly full-scene PNG, blue Warden/goblin/tree/asset-family PNGs, current-game rejection screenshot, old-anchor rejection screenshot and full written specification. These establish **one non-negotiable target**. The actual binary image files MUST be uploaded and verified against their exact SHA-256 values before claiming the PNG set is version-controlled. Writing their intended filenames in Markdown is NOT proof they exist in Git. **Current runtime visuals fail this target.**

## Operation on every development turn

1. Connect to the current canonical repository `lordfireballzmc/BrowserGame` and read latest `main`, pending PRs, this file and ART.LOCK docs. Do not rely solely on previous conversation reports.
2. Inspect relevant current code/tests and actual licensed-source manifests. Preserve strict TypeScript, deterministic fixed-60Hz game logic, real projectile collision/HP, user input, active Three.js/WebGL2 rendering, and no unauthorized paid service.
3. Choose a bounded real-player-visible improvement. Original authored sculpting, hand-painted materials/terrain/foliage, dramatic painterly VFX, proper visual staging and animation quality have priority over adding more cheap unstyled gameplay objects.
4. Work via an authorized feature branch, commit changes, test actual exact-head build, Vitest, desktop WebGL2 landscape+portrait and real controls where available; state gaps and CI status with exact evidence.
5. Every visible PR: explicitly assess **NONCOMPLIANT / PARTIAL / ACCEPTED** against the *original* user PNG. Do not call CI success, shaders, licensed CC0 assets, native DPI, GLB counts, AI mockup screenshots or renderer settings "AAA". Record actual gameplay screenshot crops, sequence/motion review and measured hardware if available.
6. Update `docs/07_SESSION_STATE.md` and `docs/06_EXECUTION_BACKLOG.md` with concise honest next steps. Do not grow huge repeated date-stamped handoffs. Historical discussions remain retrievable through Git history and committed reviews.
7. Do not silently overwrite others' work, merge red CI, fabricate binary uploads, copy proprietary competitor art, invent deployed URLs, or expose secrets. Source repo remains private; GitHub Pages has not been verified live.

## Art direction is NOT a renderer swap

The game uses Three.js/WebGL2 and fixed-step simulation. Keep functional game systems, test cases, asset provenance and legal notices intact. Upgrade all user-facing 3D geometries **and surface treatment** to original stylized hand-painted forms; source CC0 KayKit/Kenney starter assets may stay only as labeled temporary engineering stand-ins. Do not add a painted still or CSS overlay and label it a playable-game makeover. The reference PNG is an aesthetic target, not a sprite sheet to display over the level.

**Precedence:** most recent explicit user directive → [ART.LOCK](docs/art-direction/HARD_REQUIREMENTS.md) and [full spec](docs/art-direction/FENWALL_VISUAL_RECONSTRUCTION_SPEC.md) → gameplay correctness / mobile accessibility / licensing / tested performance → old VQ and historic art bibles as technical reference only.

## Current engineering and open work

- Verified `main`: real 60Hz two-wave defense, skinned starter GLBs, terrain/road/ten pads, Bolt Spires, drops and wins/losses, native-resolution Three/WebGL2, 35.264° three-quarter camera, original *partial* stone-pad geometry, compact normal-play HUD. **These are engineering milestones, not ART.LOCK-compliant art.**
- Active related PRs may include F3.04c1 shield-bearing third wave (#43), earlier VQ.04a attack/recoil (#37) and touch movement; inspect current GitHub before basing or merging.
- Top priority: **binary-ingest exact user PNG assets**, remove rejected SVG/prompts, build genuinely painterly terrain/foliage, Warden/raiders, masonry and UI, then verified animation/interaction plus full 10-wave authored campaign.
- GitHub Pages publication still requires owner-enabled GitHub Actions Pages; do not claim a public deployed URL without HTTP/browser proof.

## Verification and reporting

Report: **TASK · branch / commit / PR · files changed · actual visual evidence (or NONE) · exact CI status · failures/current art deficits · next step**. Never hide failures or mistake source-writing permission for binary-transfer capabilities. If GitHub tool limits prevent uploading the original reference files, say so clearly and retain exact hashes/asset list without marking it complete.
