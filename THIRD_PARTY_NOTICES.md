# Third-party dependency provenance and notices

## VQ.02d — modeled groundcover reused from the original KayKit atlas + two Kenney CC0 wildflowers (2026-11-11)

**Shared 3D grass and bushes:** [Kay Lousberg's free CC0 KayKit Forest Nature Pack](https://kaylousberg.itch.io/kaykit-forest). **NO new downloaded nature mesh**: the existing byte-pinned `public/assets/scenery/kaykit-forest-cc0.glb` originally imported in VQ.02b already contains the 3 true UV-atlas painted mesh nodes `Grass_2_D_Color1`, `Bush_3_B_Color1`, `Bush_1_E_Color1`. VQ.02d reuses the already decoded *single* KayKit forest atlas and the same texture object in Three.js for 736 grasses and 48 bush clusters (no duplicated model pack or runtime CDN). Exact original forest source/blob hashes remain documented under VQ.02b below; asset is **licensed non-exclusive third-party geometry**.

**Authored flowers:** original artist [Kenney](https://kenney.nl), original [Nature Kit](https://kenney.nl/assets/nature-kit), **CC0 1.0**. These 3D flower meshes contain multiple original solid-PBR material-color primitives/petals and **no embedded texture atlas**; never describe the flower sources as painted GLB textures. Both binary blobs are byte-for-byte identical to `Hidencod/tge-assets@3ddcc695adbba9fb918cf31b7c139b3f95b76910`. Tests recompute their actual Git object SHA-1 with a NUL header and inspect real glTF 2.0 mesh/material primitives:

| Local file under `public/assets/scenery/` | Exact upstream source | Exact Git blob SHA-1 | Bytes |
|---|---|---|---:|
| `kenney-wildflower-gold.glb` | `packs/nature-kit/flower-yellowa.glb` | `26adf12842ac3cabfc8475e135ae00fbbde49f78` | 7,120 |
| `kenney-wildflower-lilac.glb` | `packs/nature-kit/flower-purplea.glb` | `9a102fdd587ba2c4c345e20ae1721e4753b556eb` | 7,112 |

The VQ.02d implementation creates original deterministic **visual-only placement coordinates**, not gameplay objects or new obstacles. It adds 904 instances in at most 12 GPU-instanced group batches with no particle/billboard trick, reuses the original 258 authoritative scenery locations and validates new sites against source coast/road/river/pad/keep exclusions. The copies are sourced and licensed, not bespoke Bastionfall sculpting. The overall user-mandated professional illustrated 3D art quality remains an independent artistic standard not automatically satisfied by license or geometry provenance.

## VQ.02c — rounded organic Castle Kit boulder clusters (2026-11-11)

**Original artist:** [Kenney](https://kenney.nl); licensed **CC0 1.0**, [Castle Kit](https://kenney.nl/assets/castle-kit). Original legally redistributable GLB sources at [Hidencod/tge-assets](https://github.com/Hidencod/tge-assets) exact commit `3ddcc695adbba9fb918cf31b7c139b3f95b76910` (same pinned repository already used for VQ.02a). The runtime packages two art-authored, textured **organic rock clusters** locally, **without a CDN**, instead of the mechanical-looking KayKit source rock geometries. Exact upstream blob and binary SHA-1 match tested using `tests/scenery-art.test.ts`:

| Local file under `public/assets/scenery/` | Source path | Git blob SHA-1 | Bytes |
|---|---|---|---:|
| `kenney-organic-rocks-large.glb` | `packs/castle-kit/rocks-large.glb` | `c55e671c6c82f75d49eb7c2488bb23c514fbdee2` | 23,764 |
| `kenney-organic-rocks-small.glb` | `packs/castle-kit/rocks-small.glb` | `ab1336c3801232dccfee6fab6059bae43cbe633b` | 22,752 |

The **VQ.02b KayKit Forest Nature GLB remains bundled** because it continues to provide the five tree silhouettes and original atlas. Its two mechanical rock source node shapes are **not instantiated in VQ.02c**; the new source-pinned Castle Kit meshes render at the exact same 42 deterministic coordinates via two GPU-instanced groups. No exclusive intellectual-property claims: original Kenney CC0 source art is non-exclusive. New world-space meadow pigments/road verges (`GroundPigment.ts`) are **original deterministic code**, not downloaded imagery.

## VQ.02b — one original KayKit Forest Nature CC0 painted atlas (2026-11-10)

**Original artist:** [Kay Lousberg (KayKit)](https://kaylousberg.itch.io/kaykit-forest), **Forest Nature Pack**, FREE tier, CC0 1.0 license. The model source was legally CC0 free content and **not** the paid EXTRA/SOURCE materials. Exact third-party repackager/source: [Station-Sciences/bot-crossing](https://github.com/Station-Sciences/bot-crossing), commit `9f7dc6536aacbce2203bb705e3f0cf1772ea3fb7`, `public/assets/forest.glb`, Git blob SHA-1 `386f990dfc5580dd6c6063a1ee4838bdf4df6742`, **396,480 bytes**. Bundled unchanged as `public/assets/scenery/kaykit-forest-cc0.glb`; `tests/scenery-art.test.ts` recomputes and checks exact Git blob identity, seven selected internal mesh node names, one original embedded PBR-compatible atlas and material. This repacked binary and original models are licensed CC0; source attribution voluntarily retained. **Do not call this exclusive or originally sculpted Bastionfall artwork.**

Selected seven source scene nodes: `Tree_4_A_Color1`, `Tree_4_C_Color1` (24 pines); `Tree_1_A_Color1`, `Tree_3_A_Color1`, `Tree_3_C_Color1` (16 broadleaf); `Rock_2_C_Color1`, `Rock_3_E_Color1` (42 rock clusters). No runtime CDN, no extra paid files or copied Kingdom Rush imagery. Seven shared-atlas source meshes are used with source-provided gradients and source-verified GPU-instancing; all 82 original scenery placements and spacing/road/pad/keep exclusions remain unchanged; 176 cheap original grass/flower accents remain.

**Art-selection history:** the first VQ.02b branch briefly tested seven simpler Kenney free Nature Kit/Castle Kit GLBs, which passed source audits and browser rendering but produced too-blocky silhouettes in actual A/B frame review. They were removed from the source branch **before** merge, replaced by one coherent KayKit gradient-atlas GLB to better match the already KayKit-rigged characters. The final binary/manifest/credit above—not that abandoned experiment—is authoritative. **Professional handcrafted/unique stylized art, foliage fullness, real-device GPU performance and substantial terrain material polish remain future work.**

## VQ.02 — locally bundled CC0 authored Fenwall castle family (2026-11-10)

**Original artist:** [Kenney](https://kenney.nl/). **Original official packs and license evidence:** [Castle Kit](https://kenney.nl/assets/castle-kit), [Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit), both **Creative Commons Zero (CC0 1.0)**. The matching glTF 2.0 textured/atlas GLBs were repackaged by the independent [Tiny Game Engine free-model library](https://github.com/Hidencod/tge-assets), whose README also describes these Kenney model reexports as CC0. The author allows personal/commercial use; credit is not required, but **Kenney receives voluntary credit**.

**Exact Git source:** `Hidencod/tge-assets@3ddcc695adbba9fb918cf31b7c139b3f95b76910`. The Git object SHA-1 of **each bundled binary is identical to its pinned upstream source blob**; `tests/environment-art.test.ts` recomputes and checks that byte-for-byte identity and asserts real glTF 2.0 PBR base-color textures/embedded images.

| Bundled path under `public/assets/environment/` | Exact upstream path | Git blob SHA-1 |
| --- | --- | --- |
| `kenney-keep-main.glb` | `packs/castle-kit/tower-slant-roof.glb` | `19a2cb914f1d202faf9880faf64b006287dbc4db` |
| `kenney-turret-body.glb` | `packs/castle-kit/tower-square-mid-windows.glb` | `17bfeea94217ec38f6e7cc51908a7dc266acff4c` |
| `kenney-turret-roof.glb` | `packs/castle-kit/tower-square-top-roof-high-windows.glb` | `55d7b589a02c40731aa25448250d2211a5e7757f` |
| `kenney-pad-border.glb` | `packs/castle-kit/tower-square-base-border.glb` | `556f91c3a33588d8dd7a7a97179fa5b0f54f0b06` |
| `kenney-pad-inlay.glb` | `packs/castle-kit/tower-square-base-color.glb` | `07d7e7aed0748f59fe55d18c15deb123b76c8163` |
| `kenney-pad-glyph.glb` | `packs/tower-defense-kit/selection-a.glb` | `0a9983785b128e5182b8998bf4ea3b0a27f8420a` |

The source-pinned shapes, materials and painted-color atlases are **artist-authored**, but they are **non-exclusive, redistributed Kenney art**, *not* original models sculpted by Bastionfall, Kingdom Rush artwork, or proof of a final game art pipeline. Bastionfall's composition (a central Fenwall blue-roofed hall with two multi-storey corner turrets, ten layered tower foundations and gold placement glyphs) and the gameplay-space placements are uniquely composed here. Independent identity/sculpting, scene coherence, richer surface treatment, native mobile visual proof and final legal inventory remain outstanding. No external network fetch occurs at runtime.

## ART.03a KayKit authored and animated characters (2026-11-10)

**Artist and original author:** Kay Lousberg (KayKit). **Source repository:** [KayKit Character Pack Adventures 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0). **Original free-tier license:** Creative Commons Zero (CC0 1.0 Universal), confirmed by the author's own `LICENSE.txt`, not inferred from a third-party catalog. This license permits commercial adaptation and no attribution is mandated; credit is voluntarily retained. We do not bundle paid EXTRA/SOURCE content.

**Exact source commit:** `672074b73ba276876a19e8816ecdc5241817ab47`. Original GLB Git blob SHA-1 pins: Knight `717b56ca2b5ff5392679774725201ba03a3eefab` -> Warden, Barbarian `66d312ab6dc02b35fb648e7585bfdddb4e02eeef` -> Scrapper, Rogue_Hooded `5d2b1403240d5f9ffff12e02c017572038eca2a8` -> Runner. Source files: `addons/kaykit_character_pack_adventures/Characters/gltf/*.glb`. Their independent final SHA256, optimized sizes and animation names are recorded alongside the binary assets in `public/assets/characters/manifest.json`.

**Asset transformation:** `scripts/ingest_kaykit_characters.py` verifies source Git blob hashes, strips out unused source animation tracks and unreferenced binary buffer data, while retaining the original artist's meshes, skeletons, UV texture atlas and five animation clips per model. Source files total ~10.87MB; verified bundled output is 1,657,752 bytes. `SkeletonUtils.clone` is part of the already licensed Three.js MIT distribution, not a new third-party package.

**Originality boundary:** These are **licensed third-party prototype assets**, not newly created or exclusive Bastionfall characters and not copied Kingshot/Kingdom Rush art. Distinct original silhouette improvements, armor, colors, material refinement, rig compression and professional animation remain necessary before commercial visual completion. Do not relabel licensed prototypes as wholly original or redistribute the free pack as an asset pack.


## Current production-pipeline changes — Three.js and first CC0 3D model (ART.01, 2026-11-10)

**This section supersedes historical F0.06 statements below about “no external engine” or unused runtime packages.** Current exact-resolved versions are committed in `package-lock.json`; the old counts and original lock blob in the historical inventory are no longer current.

- **Three.js r184 / npm `three@0.184.0`** — MIT licensed, used by `src/engine/render/ImportedArtLayer.ts` to render an actual glTF asset with its authored 3D geometry and embedded PBR texture maps. Source/notice: https://github.com/mrdoob/three.js/blob/r184/LICENSE. Copyright © 2010–2026 three.js authors. The full MIT permission/copyright conditions apply to redistributed code, and must be included in final release notices.
- **@types/three 0.184.0** — declarations for the Three.js source, present only in the toolchain. License metadata and its dependencies should be checked before distribution.
- **@types/node 22.15.30** — Node.js type declarations for GLB integrity tests, not a game runtime dependency.
- **Lantern glTF 2.0 source model, CC0-1.0** — original textured old wooden lantern by Microsoft/sbtron, contributed to the Khronos glTF Sample Assets and pinned to upstream commit `0b4f3a5862f3037c7092206e75c6f2a31a504ca5` and exact source Git blob SHA `0c97893aee066b6fa36f7725443b7536c3510d09`. License evidence: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Lantern/LICENSE.md (the **model** is CC0; the repository's metadata documents may use CC BY). This pilot's derived/bundled GLB is `public/assets/lantern-cc0.glb`, with independently generated SHA256 in the adjacent `.sha256`. Conversion downscales the four embedded texture maps and preserves mesh/UVs/materials. This provenance does **not** imply approval of the asset for commercial character style or model quality.
- **Pillow 11.3.0** — transient Python image processing tool in a one-time isolated CI environment, not imported by the website or committed as an npm dependency.

### Three.js MIT notice

```text
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```


**Inventory checkpoint:** 2026-11-10 · **scope:** locked npm dependencies, *not* a completed shipping audit.

Canonical source of actual resolved versions is `package-lock.json` (npm lockfile v3, blob `6485e364b4ac221d0a67c354eb385219c31299cc`). `package.json` lists version *ranges*, not the installed exact versions. GitHub Actions uses Node.js 22 and `npm ci` to reproduce the committed lockfile. No external game engine is imported.

## Direct dependencies (exact resolved versions)

| npm package | Version | License | Role | Exact upstream license |
| --- | --- | --- | --- | --- |
| [gl-matrix](https://github.com/toji/gl-matrix) | **3.4.4** | MIT | Declared runtime math dependency; not yet imported into application code | [v3.4.4/LICENSE.md](https://github.com/toji/gl-matrix/blob/v3.4.4/LICENSE.md) |
| [twgl.js](https://github.com/greggman/twgl.js) | **7.0.0** | MIT | Declared runtime WebGL helper; not yet imported into application code | [v7.0.0/LICENSE.md](https://github.com/greggman/twgl.js/blob/v7.0.0/LICENSE.md) |
| [typescript](https://github.com/microsoft/TypeScript) | **5.9.3** | Apache-2.0 | Compile-time developer tool | [v5.9.3/LICENSE.txt](https://github.com/microsoft/TypeScript/blob/v5.9.3/LICENSE.txt) |
| [vite](https://github.com/vitejs/vite) | **7.3.8** | MIT | Build and local development server | [v7.3.8/LICENSE](https://github.com/vitejs/vite/blob/v7.3.8/LICENSE) |
| [vitest](https://github.com/vitest-dev/vitest) | **3.2.7** | MIT | Node test runner, not game runtime | [v3.2.7/LICENSE](https://github.com/vitest-dev/vitest/blob/v3.2.7/LICENSE) |

Versions above were read from `package-lock.json`; license labels were cross-checked against their upstream license files **at the corresponding version tags**. Both runtime dependencies are **installed, not integrated**: there are no WebGL helper or matrix-library imports yet. The shipped page currently consists of our TypeScript startup diagnostics, not third-party game assets.

### Other locked packages

The current lockfile records **104 installed package entries** (not including the project root) with license metadata: **99 MIT, 2 Apache-2.0, 2 ISC and 1 BSD-3-Clause**. These are *metadata counts*, not independent legal verification of every transitive package. Entries with non-MIT labels:

| Package | Version | License |
| --- | --- | --- |
| `expect-type` | 1.4.0 | Apache-2.0 |
| `typescript` | 5.9.3 | Apache-2.0 |
| `picocolors` | 1.1.1 | ISC |
| `siginfo` | 2.0.0 | ISC |
| `source-map-js` | 1.2.2 | BSD-3-Clause |

Complete transitive package identities, integrity hashes, version numbers and license labels are preserved in the committed lockfile. Before public distribution, **F8.03** must independently audit transitive dependency licenses and any bundled output, retain all required notices in delivered artifacts, and generate a full dependency inventory/SBOM. Source links are not substitutes for shipping required license text.

## Preserved upstream MIT notices for future runtime use

### gl-matrix 3.4.4

Source: [gl-matrix v3.4.4 LICENSE.md](https://github.com/toji/gl-matrix/blob/v3.4.4/LICENSE.md).

```text
Copyright (c) 2015-2025, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### TWGL 7.0.0

Source: [TWGL v7.0.0 LICENSE.md](https://github.com/greggman/twgl.js/blob/v7.0.0/LICENSE.md).

```text
Copyright 2019 Gregg Tavares

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

These notices cover the two **direct declared runtime libraries** only. No Kingshot art or proprietary assets are included. This inventory does not itself license the project's original code; the project's own licensing decision is separate.
