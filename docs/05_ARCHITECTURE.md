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
