# PR summary

## User-art direction: ART.LOCK (mandatory)

Read [approved hand-painted target / exact full user specification](../docs/art-direction/README.md) and [hard requirements](../docs/art-direction/HARD_REQUIREMENTS.md). The prior vector anchor and generic plastic low-poly game are **REJECTED**. The in-repo canonical reference must be the verified original user PNG (not a mockup or GitHub Actions screenshot).

**Does this PR modify any visible geometry/material/animation/camera/FX/UI or introduce any asset?** Yes / No

**Visual compliance result (choose exactly one):**
- [ ] **NONCOMPLIANT** — engineering scaffolding only; describe exact remaining art debt, never accepted as final art.
- [ ] **PARTIAL** — measurable movement toward exact painted reference, but substantial gaps remain; list them.
- [ ] **ACCEPTED** — actual live-game art verified against original committed canonical PNG, specific asset family only.

**Evidence for PARTIAL or ACCEPTED visual work:**
- [ ] Exact reference PNG blob path and SHA-256 from `docs/art-direction/REFERENCE_ASSET_MANIFEST.md` verified in Git (never imply "uploaded" when not present).
- [ ] Real WebGL2 16:9/9:16 same-seed, same-tick frame screenshots, normal gameplay and realistic UI.
- [ ] Same-scale reference-vs-runtime visual critique covers painted texture, silhouettes, light, staging and graphic VFX.
- [ ] Motion/foot plant/combat anticipation/recoil frame sequence reviewed where relevant.
- [ ] Performance/resource cost recorded truthfully; SwiftShader is not mobile GPU hardware.
- [ ] Exact-head strict TS, Vitest, production browser and real pad/hero/tower interactions tested.
- [ ] New model/texture provenance, permissions, attribution, asset hashes and source links recorded.

**What still fails the painted reference?**

<!-- Detailed honest list; do not say "AAA" or "hand-painted" based only on a bloom/postprocess or shader. -->

## Gameplay and repository safety

- [ ] No change to authoritative 60Hz simulation/HP/collision/purchases unless independently covered by tests.
- [ ] No copied third-party game art, no unauthorized licenses/costs, no external CDN runtime dependency.
- [ ] No resurrected `docs/visual-references/target-illustrated-3d-composition.svg` or duplicate competing design bibles.
- [ ] Update concise `docs/07_SESSION_STATE.md` and `docs/06_EXECUTION_BACKLOG.md` with current truth, not massive historical copy-pastes.

## Verification details

Commit SHA:  
Vitest / build run:  
Real 16:9 capture:  
Real 9:16 capture:  
Animation sequence:  
Device FPS: measured / not measured  

**Never mark this PR visually accepted while the primary original reference PNG is absent from GitHub.**
