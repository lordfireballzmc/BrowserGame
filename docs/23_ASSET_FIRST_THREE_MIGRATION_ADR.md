# ADR-023 — Asset-first graphics migration, Three.js PBR pilot

Date: 2026-11-10  
Status: **accepted for a bounded vertical slice**; whole-scene renderer migration **not yet authorized by evidence**.  
Authority: [master production directive](00_MASTER_PRODUCTION_DIRECTIVE.md), [3D cartoon art north star](20_VISUAL_NORTH_STAR.md).

## Current repository-specific constraints
The custom WebGL2/TWGL renderer is useful and already runs real deterministic terrain, combat, camera and shadows, with regression screenshots. However, all focal meshes are currently handcrafted arrays of beveled primitives and a small fixed material palette. It has no native glTF/GLB scene loading, texture/UV path, material maps, skinning, animation mixer, PBR shader system, or scalable asset authoring pipeline. Extending every one of those features from scratch would be both costly and unlikely to yield the premium illustrated 3D art requested by the user. The existing backend gameplay is independent of rendering, and should be retained.

## Implementation update after ART.02a (2026-11-10)

The initial ART.01 dual-canvas renderer was **retired** after validating one actual unified Three.js scene for the **default Warden gameplay preview**. The old `ImportedArtLayer.ts` has been deleted. `UnifiedThreeRenderer.ts` now imports all original gameplay meshes and the source-verified GLB into **one canvas/depth buffer/sun shadow pass** while reusing the authoritative Warden/raider/bolt simulation and exact camera matrices. The older renderer remains only for static map, cinematic, diagnostics and an explicit `renderer=legacy` Warden fallback until those remaining views pass visual/behavioral parity. The historical first-pilot description below remains as an audit trail, **not** as a current architectural claim. ART.02b must unify remaining views and remove the old backend when proven. See `25_ART02_SINGLE_SCENE_REVIEW.md`.

## Evaluated options
| Option | Strength | Liability | Decision |
| --- | --- | --- | --- |
| Keep and expand TWGL custom renderer | Existing integrated tested terrain, low overhead | Would require recreating GLB/PBR/material/animation ecosystem | Retain as fallback until a replacement covers actual game systems |
| Babylon.js | Mature GLB, PBR, animation, WebGL2 and WebGPU options | Larger migration footprint and scene lifecycle changes here; no repository evidence of an advantage | Not selected for first pilot |
| **Three.js + GLTFLoader (WebGLRenderer)** | GLB/glTF, external PBR materials, animation mixer, widely used loaders and transition to WebGPU | Need to migrate terrain batching/shadow and input-free scene projection; extra runtime while bridging | **Selected, exact-pinned r184 (0.184.0)** |
| Rust/WASM or a language rewrite | Can improve targeted CPU work | No bearing on art quality by itself, destructive to existing stable TypeScript code | Rejected without profiling |

Three.js version and types must be committed with a **reproducible npm lockfile**. Preserve WebGL2 as baseline. **WebGPU only after a supported comparative compatibility test; not in this milestone.**

## First complete vertical slice
- **Source:** Khronos glTF Sample Assets, **Lantern** (old wooden streetlight), original media **CC0-1.0**. Repo: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern; exact source commit `0b4f3a5862f3037c7092206e75c6f2a31a504ca5`, exact Git blob SHA `0c97893aee066b6fa36f7725443b7536c3510d09`; see upstream LICENSE.md. This external prop is a **technical/art-pipeline sample**, not a finished Bastionfall production hero.
- **Ingestion:** `scripts/ingest_lantern.py` fetches the pinned GLB at build time, confirms exact Git blob bytes before transformation, recompresses and downsizes embedded textures without changing mesh, normals, UVs or material assignments, validates glTF chunks and limits the final bundle to 2 MiB. Repack into `public/assets/lantern-cc0.glb`, record SHA256 and source provenance. No remote GLB is requested by the production browser.
- **Runtime:** `ImportedArtLayer` loads the **local** GLB with GLTFLoader and retains authored textured material/maps. The bounded test `?view=movement&assetPilot=1` shows it in world units with the **existing OrthoCamera matrices**, correct physical transform and warm/cool art lighting, while the regular Warden, enemies, road, shots and HUD continue to work.
- **Temporary bridge:** The original world renderer remains unmodified and visible. The GLB is composited in a separate clear Three.js WebGL2 canvas above it, **without shared depth buffer**. This deliberately does not solve scene-to-scene occlusion or world-ground shadow reception, and consumes a second GL context. **This is NOT acceptable as permanent production architecture.**
- **Graduation gate:** Replace the old rendering pipeline *only after* a new unified renderer covers (1) the authored terrain/river and pad picking, (2) instancing and stable shadows, (3) hero/raider movement and true bolt hits, (4) full-screen 16:9 and 9:16 framing, (5) loading fallback, memory cleanup and timing tests. Then remove the temporary dual-layer route. No long-lived parallel renderer.
- **Visual judgement:** Lantern textures and PBR under actual gameplay light are necessary proof of *capability*, not proof of style coherence or high-end graphics; the original playful Kingdom Rush-inspired 3D art direction remains the acceptance standard.

## QA and operational constraints
Do not ingest entire external packs; use only this independently verified source. No paid subscriptions; no public deployment; no source code execution from third-party repositories. Asset transformation uses Pillow in a constrained GitHub Actions step, and the output is committed to the repository before the game requests it. The browser test must verify one or more **actual textured meshes**, a nonempty WebGL canvas, camera consistency, and display in both 16:9 and portrait, without breaking existing Vitest + game screenshots. Running two renderers is explicitly a temporary test cost and is not called optimized mobile rendering.

### Future ordered work
1. Expand typed asset manifest and source license/hash audit to an original coherent *family* of stylized characters/vegetation/architecture, preferably CC0, evaluated for artistic consistency.
2. Replace one complete class of geometry in a **unified** Three scene; retain game state and camera projections.
3. Add animation clips/rigs with transitions, author sprite/VFX and custom toon/PBR hybrid materials, then profile real device budgets.
4. Only then deprecate the custom renderer and delete the dual-context pilot.

References:
- https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- https://github.com/mrdoob/three.js
- https://github.com/BabylonJS/Babylon.js
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/web-engines/threejs-gltf-loading/SKILL.md
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/web-engines/threejs-materials-lighting/SKILL.md
- https://github.com/3dassets-dev/3dassets/blob/main/SKILL.md (skill availability must be verified rather than assumed; it could not be retrieved in this session)
