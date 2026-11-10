# F2.06 — directional lighting and composition art review

**Scope:** engine lighting and visual studies, NOT live combat or an asset claim of Kingshot parity. Original geometry and colors remain the project's own intellectual property.

## Reference comparison and root cause
The supplied existing Fenwall screenshot was an extremely distant engineering overview without actors, keep, towers, convincing grounding, or compositional hierarchy. Its WebGL2 shader applied one constant ambient value and a plain Lambert diffuse term. This read as colored cutouts rather than a lit physical environment. Merely brightening materials could not fix that.

The Kingshot reference instead demonstrates the type of craft to pursue: close framing, recognizable 3D silhouettes, physically layered architecture, strong but soft contact shadows, vivid and differentiated color groups, softened highlights, and uninterrupted readability around the road. We are studying the **qualities**, not reproducing its copyrighted assets or exact designs.

## Concrete implementation
- `src/engine/render/SunShadowPass.ts`: fixed 1024×1024 depth-only WebGL2 framebuffer, sun-light orthographic coverage of the full island, same instanced mesh geometry for shadow casters, deterministic 3×3 percentage-closer sampling with bias. Explicit GPU lifecycle cleanup.
- `src/engine/render/InstancedRenderer.ts`: sun/key, cool hemispheric fill, subtle opposing bounce, shoulder rolloff and chroma recovery in linear color before sRGB encode. Retains gamma-correct materials and existing draw statistics. Shadow processing uses additional GPU work not counted in the primary color draw-call statistic; don't mistake those statistics for full GPU work.
- `src/main.ts`: the diagnostic archetype gallery also receives the lighting treatment.
- `src/art/models/Archetypes.ts`: the original keep has three-dimensional wood-framed entrances, glazing and shutters, physical steps and porch, a chimney and roof trim on its existing footprint.
- `src/art/models/BoltSpireStudy.ts`: independently authored 3D bolt-tower silhouette for cinematic composition. This is **not a buyable tower**.
- `tests/terrain-preview.html`: full 72×48m engineering map retained with ten selectable pads, added staged keep, hero and adversaries. Visual-study links show 1920×1080 and 1080×1920 orthographic camera compositions; they have no real wave logic.
- `tests/sun-shadows.test.ts`: geometry/lens coverage, light space, semantic lighting shader and original tower bounds.
- `.github/workflows/checks.yml`: Chrome/SwiftShader renders both compositions, checks scene status and exports PNGs.

## Real-world verification and limitations
- The first clean revision was verified in [GitHub Actions run 42777436146](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42777436146): locked npm install, TypeScript, 149 Vitest tests, Vite build, Chrome graphics + pad-click paths, and both aspect-ratio checks. Artifact 13744457445 supplied the first two screenshots; they were retrieved and visually inspected.
- An expanded-keep/chroma revision passed [run 42778024886](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42778024886), including both WebGL compositions. Retrieved artifact 13744582942 and inspected landscape and portrait: the new lighting actually changes the shapes, tree/actor contact shadows and colors. However, the east side of the keep is still sparse and flat in that angle; a subsequent authored elevation/glazing patch is under validation.
- The side-elevation patch passed [GitHub Actions run 42778571669](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42778571669): TypeScript, 149 tests, production build, real WebGL2 gallery and world/pad interaction, and 16:9/9:16 scene checks. Downloaded screenshots from artifact **13745281068** and inspected them: glazed windows with wooden framing are visible on the camera-facing east wall, physically casting and receiving sun shadows. The keep remains deliberately stylized and more primitive than the reference. A passing pixel-change test establishes that a scene rendered, **not** equivalent visual quality to the supplied advertisement.
- Kingshot-level finish remains **unachieved**. Current shortcomings: still-basic geometry, limited micro-material variation, no integrated playable battlefield, no sophisticated ambient occlusion, foliage and camera dramaturgy not artist-grade, and no runtime performance profiling for sustained mobile gameplay.
- Full-screen image quality and production gameplay are separate gates. F2.07 remains culling/performance and F3 remains playable simulation; later F4/F7 art direction will require additional screenshot QA.
