# Custom engine architecture — technical design and module contracts

## Stack
TypeScript strict, Vite, WebGL2, TWGL buffer/program helpers, gl-matrix, Vitest, Playwright. Other components introduced only in their milestone. Aim for Node 22 LTS or newer verified compatible; browser targets current desktop Chromium/Firefox/Safari with WebGL2; fallback is an explicit diagnostics screen, not an unrelated 2D game. No Three.js/Unity engine.

## Boundaries
`src/main.ts` composes Engine, World, Renderer, Controls, Assets, HUD. It is composition only; business logic lives in systems. `src/engine/` contains EngineLoop, Renderer, Camera, GPU resources and input sampling. `src/art/` contains geometry generators and deterministic procedural model definitions; no game rules. `src/game/` contains typed state, fixed-tick systems and balance. `src/ui/` DOM overlay with no direct mutation of game state. `src/platform/` lifecycle and storage. `tests/` unit, integration, visual, perf.

No direct imports from game systems into render engine; game exports immutable render snapshot. UI commands enter simulation through validated Command queue, applied at next tick. Render interpolates between two snapshots; never mutates simulation or buys towers. Gameplay logic must run headlessly in Node for tests.

## EngineLoop
Fixed timestep 1/60, accumulator from performance.now, clamp each wall delta to 0.1s, at most 5 simulation steps per rAF. On visibility hidden pause simulation and clear accumulator; don't simulate hours on resume. Alpha accum / fixed dt for visuals only. Recorder logs seed + per-tick discrete input/command snapshots. Telemetry records frame p50/p95, count triangles/draw calls, CPU sim ms.

## World state
Entity ids monotonically assigned; no reuse during single run. Typed arrays preferred for hot actor state, maps for persistent metadata and structural records. Spawn/remove intents queued and flushed after systems. Stable system order:
1 accept validated input
2 update wave scheduler
3 movement/waypoint progress
4 crowd separation
5 acquire targets
6 hero/tower attacks
7 advance projectiles + apply damage
8 enemy/core contact and tower hazard
9 resolve kills, score, loot
10 pickup and economy
11 animation events and wave transition
12 materialize render snapshot
Do not process events recursively in same tick; no mutation while iterating entity collection.

## World space and camera
Right-handed world X/Z ground, Y up. Single orthographic view, camera controller follows hero. Camera matrices tested world↔screen, 16:9 / 9:16. Use gl-matrix for mat4, vec3. Keep all physics in X/Z; convert to Y only for terrain height and render.

## Render architecture
WebGL2 only, detect limits and install context loss/restoration handlers. Shader minimal: material vertex color + Lambert directional light + ambient. Mesh = static GPU buffers + bounding volume; Material = palette token + opacity/feature flags. DrawBatch = mesh handle + material + array of instance transforms and packed colors. One shader program for opaque + one transparent pooled effects; sort opaque by material/mesh, transparent far-to-near. Use vertex array objects, ELEMENT_ARRAY_BUFFER, instanced mat4 transform, gl.drawElementsInstanced. Avoid JS draw call per actor; allocate reusable transform Float32Array with exponential growth, update via bufferSubData. Enforce depth test, backface cull, blending only in transparent pass, correct sRGB color approximation and devicePixelRatio cap.

## Mesh contracts
`Geometry {positions: Float32Array, normals: Float32Array, indices: Uint16Array|Uint32Array, materialIds?:Uint8Array, bounds: AABB}`. Generate all geometry deterministically from data + seeded PRNG. Tests: count, finite components, valid index range, nonzero triangle area, bounds. Use parameter grammar described in ART bible. Primitive recipes: faceted prism, capsule-ish humanoid sections, tapered cylinders, wedge, bevelled box, planar ribbon, sphere rings, flat shadow disk. Add specialized semantic meshes only by composition of these.

## Simulation and difficulty
Data-driven Balance and WaveConfig with explicit initial values in design bible, not arbitrary constants in multiple systems. Seeded PRNG version number. Movement is circle vs static segment and smooth lane projection; short-range separation via spatial hash 2m cell, stable ID order, no physics engine. Tower target tests and cooldown independent of frame rate. Attack events immutable with id and tick; projectile collision swept segment and consistent impact order.

## UI
Native DOM for readable text, buttons, keyboard semantics; canvas fills view. UI command validation done by game layer, not browser DOM. HUD uses palette tokens and safe area CSS. Never import a component design system, UI kit, React or animation framework simply for convenience. Controls support desktop and touch, pointer-to-world ray-plane intersection.

## Storage and deployment
Build static assets with Vite; V1 deployment through GitHub Pages if desired. GitHub Pages **does not provide a literal persistent dedicated IP**; use a custom VPS later if actual IP/domain desired. Local run doesn't require network. Private GitHub repository Pages support depends on plan/visibility; do not assume deploy works until settings verified. CI runs typecheck, tests and production build before deploy. Don't activate public production deploy without permission. Private dev preview may use separate hosting.

## Security
No secrets in repo; no user-controlled eval; no dynamic npm shell commands from gameplay, restrict third-party scripts, sanitize display names if introduced. If agent proposes new services, permissions, billable resources or public endpoints, request user approval.

## Testing levels
Unit: PRNG, timing, economy, damage, movement, mesh geometry. Integration: same seed+commands returns same authoritative snapshot hash across runs. Browser: load start, WebGL2 ready, begin run, WASD moves, enemy arrives, coin pickup and tower purchase work, game-over possible. Visual: two recorded screenshots per milestone desktop 16:9 and portrait 9:16, inspected by explicit evidence. Performance: record hardware, browser, viewport, enemies, GPU/render/CPU frame budget. Never claim pass without execution output and commit SHA.

## Design decisions
ADR-001: custom WebGL2 rather than Three.js for ownership and performance control.
ADR-002: deterministic pure simulation with time-step separation.
ADR-003: procedural **authored** geometric model library, no image generation.
ADR-004: fixed-route wave maps first, A* only once roads branch.
ADR-005: no backend for single-player MVP; save locally.

## ADR-006: resolved build dependencies, provenance and attribution (2026-11-10)
**Status:** accepted as the reproducible F0 baseline. This is an architecture-dependency record, not evidence of completed 3D rendering or third-party asset integration.

The manifest's caret version ranges resolve through committed npm lockfile v3; production/developer installs should use `npm ci` with Node 22 (as in `.github/workflows/checks.yml`). At this checkpoint the exact locked direct versions and roles are:

| Boundary | Locked library and version | License | Integration status |
| --- | --- | --- | --- |
| Linear algebra | gl-matrix **3.4.4** | MIT | **Integrated in F1.02:** `src/engine/Camera.ts` uses the pinned `mat4.lookAt`, `mat4.ortho` (alias of `orthoNO`), `mat4.multiply`, `mat4.invert`, and `vec3.transformMat4` interfaces; round-trip and aspect tests in `tests/camera.test.ts`. |
| WebGL helpers | twgl.js **7.0.0** | MIT | Installed, **not yet imported**. F1.01/F1.04 will use limited buffer/program helpers; the game still owns WebGL resources, lifecycle, and draw policy. |
| Compiler | TypeScript **5.9.3** | Apache-2.0 | Used by strict `tsc --noEmit` scripts, verified on CI. |
| Bundler | Vite **7.3.8** | MIT | Used to build the application and run the dev server, verified on CI. |
| Tests | Vitest **3.2.7** | MIT | Used for deterministic simulation and startup tests, verified on CI. |

**Architecture decisions carried forward:** retain a purpose-built WebGL2 renderer (ADR-001) and fixed-step headless simulation (ADR-002); no Three.js/large game engine. `src/platform/Startup.ts` owns WebGL2 capability/fatal handling; `src/engine/Loop.ts` owns fixed-step timing; `src/game/Random.ts` and `src/game/Balance.ts` own deterministic RNG and numeric rules. None of the F1 render/geometry imports are implemented yet.

**Dependency change protocol:** check exact upstream version/tag and license, update manifest and lockfile together, `npm ci`/typecheck/test/build, re-check runtime imports and transitive licenses, update `THIRD_PARTY_NOTICES.md`, and record browser/test evidence separately. Do not infer library API usage, security audit, screenshots or deployed gameplay from package installation alone.

**Attribution source:** [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) records the five direct locked packages, exact tagged license links, full notices for both currently declared runtime libraries, and the limits of transitive license metadata. A release-ready SBOM, full transitive verification and distribution notices remain explicitly assigned to F8.03.

## F1.02 camera coordinates and matrix contract
- Source is [gl-matrix v3.4.4](https://github.com/toji/gl-matrix/tree/v3.4.4); `mat4.ortho` uses OpenGL/WebGL normalized Z in [-1, 1] and `mat4.multiply(projection, view)` composition. This API was checked against its tagged source before integration.
- `src/engine/Camera.ts` is headless and does not depend on DOM/WebGL. World is X east, Y up, Z north. The camera is fixed at azimuth 45° and 53° above the horizon, looking toward its focus from positive X/Z; there is no camera rotation or arbitrary orbit.
- At zoom 1, camera-plane vertical span is **31 meters** at both 16:9 and 9:16; horizontal span is 31 × viewport aspect. Zoom is limited to 0.88–1.12 and reduces visible world area as zoom increases.
- `project` maps any 3D world point to top-left-origin **canvas-local CSS pixels**, returns clip depth and visibility. `screenToGround` inverse-projects screen coordinates as an orthographic ray and intersects a constant-Y ground plane; it returns `null` if the plane intersection falls outside clip planes. Pixel coordinates are *not* window/page coordinates; subtract canvas bounding-rectangle left/top in pointer handlers.
- `follow(hero, dt, leadXZ)` damps in X/Z only with 0.17s time constant; optional lead shifts focus ahead of hero movement without coupling camera to gameplay physics. Follow is render-only and is not part of deterministic game state.
- Tests cover desktop and portrait viewport corners, X/Z ground picking round-trips, resize, zoom bounds, matrix-copy isolation, and frame-partition-independent exponential smoothing. A visual screenshot review and integration with gameplay/canvas remain pending F1.05/F3.01.

## F1.03 procedural mesh construction and verification
- `src/art/mesh/Primitives.ts` is a **pure CPU** geometry library: mesh outputs are immutable-by-contract geometry objects containing `Float32Array positions/normals`, `Uint16Array|Uint32Array indices`, a `Uint8Array` of per-vertex semantic material-slot IDs, and measured AABB minimum/maximum coordinates. No WebGL objects are created; actual GPU uploads and instance/mesh caching belong to F1.04/F2.
- Object coordinates are meters and centered on the local origin; +Y is up. Triangles follow outward-facing CCW winding, with explicitly duplicated face vertices where needed for **flat shading** (hard edges). An inward-facing triangle, unnormalized/inconsistent normals, invalid indices, nonfinite data, incorrect bounds, or degenerate triangles are rejected by `validateGeometry` before upload.
- Available primitive generators: `bevelBox` (genuine 12 edge strips + 8 corner facets for positive chamfer), `facetedCylinder` (capped frustum), `wedge`, `pyramid`, `facetedEllipsoid` (nonplanar latitude-ring quads split into planar triangles), `planarDisk` (+Y normals), and `planarRibbon` (authored XZ path, default height +0.02m, bounded miter length and reversal rejection).
- Parameters are deterministic and validated. These are *building blocks*, not random game props or finalized visual assets; the art bible still controls semantic materials, shape dimensions and composition at F1.06/F2. All generated meshes must be cached at archetype/seed creation rather than re-generated on each render frame.
- `tests/mesh-primitives.test.ts`: 15 cases covering dimensions, faceting/topology, winding, bounds, correct normals, material IDs, deterministic typed buffer contents, valid and invalid paths, and invalid geometry mutation. First verified in GitHub Actions PR #8 run 42754586914, and reverified after strict secondary-vertex normal validation in run **42754758453** (job **129626435255**): npm ci, typecheck, Vitest, Vite build, headless Chrome fallback and software WebGL2 startup all green. No in-game mesh rendering, camera-scene integration, screenshot, draw-call measurement or performance claim yet.

## F1.04 — instanced WebGL2 renderer (verified 2026-11-10)
- `src/engine/render/InstancedRenderer.ts` owns one context-scoped `GpuResources` instance: static positions, flat normals, and per-vertex resolved palette colors are uploaded **once per registered mesh**; index buffers are preserved in each VAO. Each mesh's vertex attributes 0/1/7 are static, with instance attributes 2–5 for column-major model matrix and 6 for linear-light RGBA (`vertexAttribDivisor = 1`).
- The renderer owns **one reusable shared GPU instance stream**, initially eight records and expanded by powers of two (500 instances → capacity 512). Dynamic `bufferSubData` updates instance transforms/colors each batch; geometry and vertex arrays are never recreated per frame. It invokes `gl.drawElementsInstanced` for each batch.
- Opaque instances are batched by mesh ID + semantic material. Transparent instances are sorted by eye-space center depth (far-to-near), batched **only for contiguous compatible entries**, blended with SRC_ALPHA/ONE_MINUS_SRC_ALPHA, with `depthMask(false)` during the transparent pass and restored afterward. The opaque pass enables depth testing and back-face culling. Transparent-center sorting is an MVP approximation for intersecting translucent volumes.
- `src/engine/render/Palette.ts` reproduces all **21 art-bible sRGB tokens** and converts each component to linear-light with the IEC sRGB transfer function. Vertex material slot 0 inherits the per-instance token; positive slots 1–21 select a canonical per-vertex token. Shader implements flat-normal Lambert directional lighting plus ambient in linear light and encodes the result to sRGB for the default drawing buffer. Alpha blending uses the WebGL default buffer's blending behavior; **physically exact linear-space alpha compositing is not claimed**.
- `tests/renderer.test.ts` covers palette transfer and all 500 objects merging to one draw, buffer growth/reuse, depth-sorted transparent draws, alpha-zero skips, invalid matrices/mesh keys, and resource disposal. `tests/renderer-benchmark.html` is a **diagnostic-only** page, not playable art; it renders 500 flat-shaded beveled test primitives and requires real framebuffer samples to differ from the clear color.
- **Actual acceptance trace:** [PR #9](https://github.com/lordfireballzmc/BrowserGame/pull/9), Actions run **42756138916**, job **129630871171**. Software WebGL2 (ANGLE SwiftShader, headless Chrome on GitHub `ubuntu-latest`), 12 draws of the benchmark frame: **500 instances, 1 draw call, 22,000 triangles, 54,386 changed framebuffer sample positions, instance stream capacity 512**, and **43.2 ms CPU-submission p95** over 10 warm frames. 76 Vitest tests, strict TypeScript, Vite production build and prior two browser checks passed. CPU p95 is measured using `performance.now` around JS submission; it is **not GPU time or frame time**, and does **not** satisfy a 60-FPS performance claim. Optimization and visual-quality benchmarks remain F1.05/F1.06 and later.
- This renderer is intentionally not yet wired into the actual game startup's splash/diagnostic; F1.05 adds canvas resolution, render metrics and error integration, F1.06 adds real game archetypes and visual inspections. Keep renderer failures distinct from GPU loss and never claim authored game art from this engineering fixture.
