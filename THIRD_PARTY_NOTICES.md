# Third-party dependency provenance and notices

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
