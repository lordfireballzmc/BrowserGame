# Bastionfall original concept-image generation recipes

**Purpose:** reproducibly create *aspirational* visual studies for future art reviews. These are original direction prompts, **not** instructions to generate a clone of a particular commercial game or to pass AI stills off as screenshots.

Every prompt must reference `../20_VISUAL_NORTH_STAR.md`. The three recipes deliberately use **different deliverables**; do not accidentally generate a multi-panel montage when the brief requests a single gameplay frame.

## Recipe A — one full 16:9 action screenshot
> Design **one single continuous 16:9 isometric-looking 3D gameplay screenshot**, not a collage, split screen, concept sheet, marketing poster, comparison, image grid or storyboard. Original title BASTIONFALL. Small handmade fantasy island with one thick ochre winding path, inviting blue-tile-roofed frontier keep, timber bridge over bright teal river, chunky arrow/crossbow stone towers, golden-blue Warden actively firing a distinct visible copper projectile at cute but threatening red hooded Scrappers and fast narrow-scarfed Runners. Very expressive original faces, helmets, hands and gear; exaggerated readable silhouettes and real 3D thickness; cozy stylized trees and shrubs, curated flowers/rocks, sculpted carved masonry and rounded timber. *Illustrated-storybook cartoon brought into high-quality 3D*, bold clean shapes with restrained contours, matte painted broad light ramps, warm sunlight/cool shadows, satisfying contact shadowing and colorful but legible material hierarchy. Playfulness, readable combat, soft visual depth, physical action and polished original mini-game feel. Small tasteful readable HUD only (title, Warden HP, Wave 2, 35 Crowns, pause). No third-party icons, copyright characters, exact existing game assets or branding. Leave unobscured road and genuinely readable hero and raiders.

## Recipe B — one portrait 9:16 mobile gameplay screenshot
> Design **one portrait 9:16 continuous 3D gameplay screen** from BASTIONFALL, **not** a montage or style board. A close readable section of the same original winding road, blue-roof keep visible near top, the Warden center-left actively tracking a close red-raider column, dramatic but not overwhelming copper bolt impacts, friendly stone tower to one side, water/bridge and lush storybook terrain framing edges. Chunky curved/tapered character proportions, expressive helmets and motion silhouettes, sculptural 3D readability from elevated orthographic camera, warm and cool cel-style illumination, painted materials rather than realistic grain, compact fantasy-illustrated UI at safe upper/lower edges for touch without shrinking battlefield. Clearly different composition adapted for portrait instead of a vertical crop. Avoid luxury strategy HUD chrome and cinematic film advertising appearance.

## Recipe C — illustrated 3D shape/material/animation study
> Create **one clearly labeled art-direction study sheet** for the original IP BASTIONFALL. Include separate mini-silhouette turnarounds for Warden, Scrapper, Runner, Shieldbearer, stone crossbow spire and cozy blue-roof keep; a row of stylized 3D wood, stone, roof, grass, cloth and copper material swatches; a compact demonstration of a real articulated run cycle and anticipation-to-release-to-impact motion; a small daytime landscape scene and compact rainy evening variant; and blue/gold versus red identity swatches. All parts of the sheet should have compatible chunky, friendly, illustrated high-quality 3D cartoon proportions and clean dark contour treatment; no photoreal textures, ornate luxury strategy UI or 2D borrowed sprites. Clearly stamp `CONCEPT REFERENCE · NOT IN-ENGINE`.

## Universal visual rejection criteria
Reject and regenerate if any occur:
- Photoreal environment/realistic human body armor, fine photographic stone PBR, glossy gold-trimmed resource widgets, excess god-rays/bloom, dramatic background bokeh or a faux mobile-strategy advertisement
- A single gigantic castle with tiny ant-sized fighters or unfollowable road; towers look like decorative castles rather than readable firing devices
- Flat/featureless low-poly blocks, monotonous cone-tree forests, giant empty grass planes, generic geometry without intentional edge/plane variation
- Particle noise over the whole screen, dozens of flashy numbers, illegible HUD text
- A multi-panel layout when recipe A or B explicitly asks for **one screenshot**, or a vertically cropped 16:9 view misrepresented as true 9:16 design
- Art that imitates a specific third-party character, game logo, tower icon, sprite frame, map layout or HUD.

## Version control discipline
When a high-res final image is successfully committed as an **actual Git binary asset**, update `docs/visual-references/README.md` with its repository-relative path and Git blob SHA; do not merely attach an image in ChatGPT and say it exists on GitHub. Keep original prompt/version and human critique with the file. A new agent may regenerate a *different* image with these prompts, but must not silently replace an approved reference: revisions require visual review and an updated `docs/21_VISUAL_REVIEW_HISTORY.md` entry.

## Engine versus concept
Concept frames are **artistic targets**, not numerical claims about the rendered code. Validate final changes in the real game scene at 16:9 and 9:16 with recorded frame/window configuration and actual mobile device measurements when available.
