# Third-party dependency provenance and notices

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
