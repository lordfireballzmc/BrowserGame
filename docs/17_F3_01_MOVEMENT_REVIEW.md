# F3.01 — Warden locomotion, grounded collision and studio presentation review

**Status:** implementation and headless tests are authored; final full-viewport browser screenshot inspection/CI verification pending. This is a **movement-only** slice, not a playable tower-defense game.

## Design intent
The latest full-island world already has original 3D geometry, warm/cool lighting, retained 1024² sun shadows, palette and deterministic props, but it previously rendered only staged figures. F3.01 moves the *same original Warden mesh* through the existing geometry without replacing the physical scene with an unrelated test world.

Controls and simulation:
- WASD / arrow keys are projected into the existing fixed 45° camera-relative ground plane. Diagonal input is normalized to the same maximum 4.2m/s as cardinal movement.
- Continuous acceleration 16m/s², deceleration 23m/s², 0.55m character collision radius come from the versioned balance data. Movement uses the existing 60Hz bounded fixed-step `EngineLoop`, not rAF-derived variable motion.
- Authored coastline is radius-sampled; the physical 7×7m keep is solid, river water is blocked except at both designated timber bridges. Sliding across unobstructed axes is allowed. Road and empty tower pads remain walkable.
- Every simulation step produces an immutable, replayable tick snapshot. Render-only interpolation never changes simulation state.
- `OrthoCamera` follows at the 0.17s documented damping constant with a small forward velocity lead. Y-position from `terrainHeight` grounds the character; the camera does not inherit the Warden's motion bob.
- Warden rotation eases toward travel with 0.10s time constant. A subtle distance-driven squash and vertical weight shift adds basic motion feedback; **no skeletal walk-cycle is claimed** (F4.01 will provide articulated animation).
- Escape pauses/resumes; losing window focus pauses and clears input; hidden-document handling is owned by `EngineLoop`. No automated enemy movement/combat, purchases or joystick are represented as implemented.

Presentation:
- `?view=movement` and `?view=movement&aspect=portrait` use the *same real* WebGL2 instance meshes and sun shadow pass as the existing map/cinematic preview. Movement fills a centered game viewport at native 16:9/9:16 aspect, without stretching or technical-page chrome.
- A restrained, keyboard-readable in-world HUD shows input hints and current movement state, with a genuine menu link. It deliberately says *movement only* rather than presenting simulated wave data.
- The home screen links to the preview and honestly identifies all unfinished actions.

## Tests and evidence
- `tests/hero-movement.test.ts`: normalized speed, authored camera axes, acceleration/drag, coastline/keep collision, bridge passability, stable historical snapshots/interpolation and illegal input rejection.
- Chrome/SwiftShader script drives an actual `KeyboardEvent` through registered DOM handlers, applies 90 fixed 60Hz simulation updates, repeatedly follows the camera over the resulting path, asserts collision-safe 3–6.35m displacement and bounded follow error, then renders real landscape and portrait screenshots with the original scene and shadows.
- Existing ten-pad interactive click probes, procedural geometry, shaders, gallery, startup recovery and cinematic views remain required CI gates.
- Earlier [Actions run 42789326853](https://github.com/lordfireballzmc/BrowserGame/actions/runs/42789326853) verified the first movement route and captured screenshots, but the page still resembled a technical inspection rather than a finished game screen. Those screenshots were downloaded and inspected; the frame and model render but the technical header dominates especially in portrait. Final presentation refinement is undergoing a separate check.

## Unfinished quality work
The Warden still uses an original baked rigid mesh, so body-part swing, foot contacts, fabric, visible firing animations and high-end model fidelity remain missing. Still enemies are set dressing, not real gameplay. Future F3 tasks introduce simulated enemies and combat; F4.01 will supply articulated animations. Later mobile touch, device performance, and Kingshot-comparable authoring need **separate screenshot and real hardware evaluation**. No GPU FPS or battery-life claims are made.
