# ART.LOCK — visual do / do not

Read [the canonical hard requirement](HARD_REQUIREMENTS.md), [the exact full user reconstruction spec](FENWALL_VISUAL_RECONSTRUCTION_SPEC.md) and [the original PNG manifest](REFERENCE_ASSET_MANIFEST.md) before making visible game changes.

| Asset / concern | Required | Reject |
|---|---|---|
| Painted surface | Gouache/dry-brush variation, intentionally broken irregular planes | Smooth uniform albedo, glossy/clay PBR, generic asset-pack finish |
| Terrain | Asymmetric olive/mustard clumps and painted ochre road banks | Flat saturated green slab; perfectly smooth tan highway |
| Trees | Dramatically twisted painterly wood; flattened wind-swept yellow-olive foliage masses | Round ball crowns, cone pines as final hero foliage, procedural grass spam |
| Stone / keep | Chipped hand-cut chunky warm/cool blocks, weathered banners and masonry | Identical smooth tower columns, generic cuboid keep and gray cylinders |
| Characters | Short expressive blue-caped Warden and angular red hooded goblins with large readable gear | Tiny undifferentiated marbles, clean toy costumes, copied third-party designs |
| Projectiles / hit | Sharp hand-painted copper/orange/cyan streaks, deliberate 2D-inspired swooshes in real 3D simulation | Constant glow, huge bloom, neon lasers, random particles masking melee |
| UI | Dark teal/pigment, ochre imperfect edges, serif parchment hierarchy, compact functional buttons | System-dashboard pills, mirrored casino-gold frames, illegible miniature controls |
| Camera | Three-quarter 35–45° angle, natural layered composition and playable 9:16 reframing | Overhead map view, crushed portrait crop, blurred depth of field |
| Production claims | Reference + actual same-state runtime A/B, device cost and clear shortfall list | Calling a green build, painterly mockup, texture pack or GLB import "AAA" |

## Canonical palette (anchor, not uniform fills)

`#0B3038` deepest teal; `#234B55` distant cliffs; `#55653C` moss shadow; `#7C8540` olive grass; `#B5AE4A` lit leaves; `#D3C365` leaf highlights; `#D7AD6D` road; `#C6B38D` stone light; `#555D5B` stone shade; `#543B2A` timber; `#17658A` defender; `#A6352B` raiders; `#FF921D` fire; `#8CE9DF` crystal; `#DDB46A` UI brass; `#F0D9A4` cream text.

Variation inside each material family is REQUIRED; the palette is not a list of flat mesh tints.

## Reference-versus-real-game discipline

- Original scene PNG is the approved composition anchor, not a published gameplay screenshot.
- Supporting tree / raider / Warden / asset-family images are shape-and-surface references, not imported **runtime** 3D meshes.
- The current runtime screenshot and former vector anchor are **negative references**.
- A hand-painted texture applied to a toy-shaped procedural cone does **not** pass. Geometry, paint, light, motion and composition must all agree.
- Asset names, provenance, licensing, hashes, review and actual runtime acceptance must be logged; no unreviewed model import becomes final by default.
