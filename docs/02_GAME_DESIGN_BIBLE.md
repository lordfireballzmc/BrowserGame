# BASTIONFALL — Game Design Bible, v0.1

**Status:** SPECIFICATION, not a report of implemented code. Superseded only by an explicit documented product decision. **Genre:** single-player, real-time hero-action + tower defense. **Platform:** desktop and touch browser. **Engine:** our own WebGL2 custom engine with narrowly scoped reusable libraries. **Art:** coherent procedurally modeled stylized 3D geometry. **Business:** no ads, purchases, idle grind, loot boxes, pay-to-win or compulsory account.

## 0. North star
A small golden-cloaked warden defends a frontier keep from rivers of crimson-clad raiders. The player moves at all times, shoots automatically at prioritised nearby threats, picks up physical coin drops, and converts them immediately into tangible defensive infrastructure. Every purchase changes a visible silhouette and the flow of combat. Each 25-second burst of risk produces a new tactical choice. The game shown in its trailer is exactly the game played.

**Non-negotiable:** at any given moment, a screenshot must answer (a) who am I? (b) where are enemies coming from? (c) what do they threaten? (d) what can I build? (e) how can I afford it? A first-time user understands in 6 seconds without tutorial paragraphs.

## 1. Core loop / player fantasy
RECONNOITER → shoot / dodge / lure → collect coins → sprint to valid pad → buy or upgrade tower → survive pressure → collect wave reward → choose route / improvements → repeat. Attacks are automatic, but positioning, body-blocking avoidance, route selection, tower placement, economy, timing and upgrades are deliberate inputs.

- Time-to-first-movement: <1 s after PLAY.
- Time-to-first-kill: <8 s.
- Time-to-first-affordable-defense: within first 30 s on tutorial map when played normally.
- First completed round: 45–90 s.
- Standard stage campaign target: 15–25 minutes for 10 waves.
- No tap-spam UI, no energy bar or waiting timers.
- Target skill gradient: intuitive first five minutes; deep choices by wave 4; failure by mistakes not hidden dice.

## 2. Coordinate system and camera
World X: west (negative) to east (positive); world Z: north (positive) to south (negative); world Y: vertical/up. Initial island ground: X ±36m, Z ±24m, elevation Y=0; base/core at (+31m, 0, +2m). Enemy spawn at (-34m,0,-5m). A curved, unobstructed 4.5m-wide road links entry to core. Towers placed on designated 4×4m pads 2m outside road shoulder. UI maps coordinates, not screen pixels.

Camera: **orthographic 3D** at azimuth approximately 45° to game axes, downward tilt 53° from horizontal, target slightly ahead of hero, initial ortho visible world height 31m at 16:9, controlled zoom 0.88–1.12, follow damping time constant ~0.17 s. No camera spins, cinematic cuts, extreme lens distortion, auto panning away from hero, fake depth-of-field, or weapon-follow shake.

Camera collision and clipping: rock and roof pieces must never hide the player for >0.4 s; fade obstruction opacity to 0.25 where necessary; no clipping across ground plane. Screen-space top margin reserved for wave/core UI.

## 3. Interaction and input contract
Desktop:
- WASD / arrows: camera-relative planar movement, normalize diagonal vector.
- Mouse: hover pad shows cost, projected range, and expected DPS; click selects build pad; E confirms hovered/nearest pad if within 2.2m.
- Numbers 1–4: choose defense family in selected-pad radial.
- Space: 2.6m dash, cooldown 6.0s, 0.18s duration, no invulnerability in initial balancing.
- Q: one-use per wave rally pulse after unlocked.
- Escape: pause/settings.
- R: restart only on results screen, not during battle.
- Tab: inspect wave/economy overlay without blocking input.
Touch: lower-left analog pad through nipplejs, right-bottom contextual build/upgrade button, one large action for dash; safe areas, touch targets ≥44 CSS px, no gestures requiring two hands simultaneously. Never force virtual joystick on desktop.

Hero speed 4.2m/s, acceleration 16m/s², deceleration 23m/s², radius 0.55m. Input lock only during pause, menu, or explicit 0.1s respawn fade. Cursor/hover always corresponds to exact currently highlighted pad; pressing confirm cannot buy the wrong item. Purchases require valid-range, sufficient-money, unoccupied pad, and no temporary lock; failed purchases change neither coins nor build occupancy.

Auto-attack: target within 7.0m; default at 0.55s interval, 8 base damage, projectile travel 15m/s, 0.12m bolt radius. Prioritise enemy within 5m of core first, then nearest to hero, then lowest stable entity ID. Aim is interpolated ≤0.12s. No attack while a blocking menu is open. Hero can move and attack simultaneously.

## 4. Economics and physical drops
Currency: **copper crowns**, HUD icon a simple octagonal coin with square-punched center, not Kingshot currency glyph. Starting balance: 25. Each Scrapper drops 2–3 crowns; Runner drops 2; Shieldbearer 5; Sapper 6; Banner 7; Behemoth 45. Use integer amounts with seeded PRNG for ranges; never floating-point balances. Individual drops coalesce visually into stacks when >60 are nearby; reward still exact. Physical pickups appear 0.15s after kill, ballistic arc 0.2–0.35s, magnetic pickup begins at 1.7m (0.32s easing), pickup confirmation once, never doubled by overlap. Dropped cash expires after 22s only if player had time to reach it; expired funds go to an explicit post-wave recovery pot at 50% rather than disappearing without explanation.

One-time build cost, then fixed upgrade costs. Base tower costs: Bolt 20, Barrage 35, Mortar 50, Ward 45. Upgrades cost 70% of base for T2, 130% of base for T3, rounded up. No infinite upgrade ladder: 3 tiers maximum. Selling returns 45% of paid coins and is disabled during combat in V1, clearly labeled.

A well-played wave should finance 1–2 consequential decisions. No random shop offers. Extra waves are unlocked through play, not through waiting.

## 5. Combat and enemy taxonomy
All game logic uses integer/float specified in canonical balance data; these values are starting targets and will be tuned against recorded playtests, not silently modified in code.

| Enemy | HP | speed m/s | contact DPS | coins | primary special | silhouette |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Scrapper | 30 | 1.8 | 7 | 2–3 | none | narrow crimson helm + rusty spear |
| Runner | 18 | 3.4 | 5 | 2 | outruns slow towers | forward-leaning wedge and long scarf |
| Shieldbearer | 72 | 1.25 | 9 | 5 | 45% frontal reduction on incoming shots | wide kite shield and squat stance |
| Sapper | 48 | 1.65 | 12 vs tower | 6 | diverts to nearby tower if reachable | pack with lit orange fuse |
| Banner | 50 | 1.55 | 5 | 7 | 1.2× speed for allies within 4m, nonstacking | tall split fork banner |
| Behemoth boss | 620 | 0.75 | 20 | 45 | calls 4 Scrappers every 8s; heavy armor 15% | broad hammer and slab shoulders |

Enemy steering: follow authored smooth lane from entry to core; never zigzag unnecessarily. Runners can take inner shoulder but stay inside nav corridor. Separating local agents use stable pair ordering with capped displacement; crowd must feel flowing, not like a jittering bag of marbles. Enemies attack the core in <=2.0m radius; tower-hunting only for explicitly tagged Sappers. Shield defense based on direction of projectile versus shield normal: acceptance tests for front and rear arcs. Banner buff animation provides a visible radius ring every 2s, not infinite glow.

Player health 100; enemy contact inflicts damage with 0.6s per-attacker strike cadence and 0.28s per-source cooldown to avoid overlapping touches machine-gunning health. On player death, hero respawns at core after 4s with 50 health; core loses 20 HP; reset dash. Defeat only when core 300 HP reaches 0. The player must be important but not a single-touch run end.

## 6. Defense system
Each pad is precisely located outside combat road; available pads have gray carved-stone octagons, coin cost ring, and transparent projected tower footprint. Pad transitions: empty → affordable highlight → constructing (0.35s) → active → optional T2 → T3 → destroyed/repairable. Towers **must** visibly change mesh at every tier, never only a larger number.

| Family | Cost | range | rate | damage | targeting | special |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Bolt Spire | 20 | 9.5m | 1 bolt / 0.9s | 13 | first progress to core | hits one; fastest tracking |
| Arrow Rack | 35 | 7.5m | 3 arrows / 1.8s | 7 each | closest cluster | three spread bolts, one target max 3 hits |
| Lobber | 50 | 10.0m | 1 shell / 2.8s | 31 center | max enemy density | 2.1m blast, edge falloff to 40% |
| Signal Ward | 45 | 6.0m | none | none | adjacent towers | +15% attack-rate to 1 nearest +1 other; cap 30% total |

Tier 2: 1.45× raw damage or throughput; improved silhouette; Tier 3: 2.1× raw throughput vs T1, additional meaningful effect per tower (Bolt pierce second target at 50%, Rack +one arrow, Lobber +0.6m AoE, Ward extends radius +1.2m). Use exact dynamic DPS readout; do not include Ward in automatic targeting trees. Tower projectiles have visible flight arcs and actual travel time; hits occur on intersection, not purely on firing. Missed projectile cannot hit an invisible unrelated target.

Enemy attack tower for Sappers: tower HP 150/200/250 by tier. A destroyed tower's pad is repairable between waves at 40% of paid cost; no unrepairable deadlock.

## 7. Waves and pacing
Wave controller phases: tutorial splash (2–4s) → Preparation 12s → Active spawn 20–50s with count budget → Cleanup (until no live enemies or 30s soft cap) → Recovery 12s → next wave. Never spawn in an unbounded while loop; each wave has finite scripted generator budgets and seeded composition. Indicate wave N/10, enemies remaining (living plus pending spawns), core HP, remaining buildup seconds.

Wave setup targets:
1. 10 Scrappers, no special; two clear build pads.
2. 14 Scrappers + 5 Runners; 1 extra pad.
3. 18 Scrappers + 8 Runners + 3 Shields; first meaningful flanking timing.
4. 20 + 10 + 6 Shields + 2 Sappers; first tower hazard.
5. 24 + 12 + 8 Shields + 3 Banners; mixed pressure.
6. 26 + 14 + 10 Shields + 4 Sappers + 2 Banners.
7. 30 + 16 + 12 Shields + 5 Sappers + 3 Banners.
8. 34 + 18 + 14 Shields + 6 Sappers + 4 Banners.
9. 38 + 20 + 16 Shields + 7 Sappers + 4 Banners.
10. Behemoth + 35 Scrappers + 22 Runners + 12 Shields + 6 Sappers + 4 Banners; stage finale, warning cue 4s before boss.

Spawn timing: schedule across active window with per-second cap 6 and staged microbursts, enemies visible entering at spatial edge. After cleanup, restore up to 20 hero HP, grant a clearly labeled 10-crown wave reward, and offer one of three *nonrandom* milestone bonuses at waves 3/6/9 (hero attack +12%, tower repair +25% cheaper, or pickup magnet +0.8m); choose once per run; duplicate choices disallowed. These are upgrades, not monetization.

Adaptive difficulty: NONE in alpha. Fair deterministic scenarios come first. Damage numbers visible only on hover/inspect and optional advanced setting, not thousands of floating labels.

## 8. Stages, maps and replay
**Initial release stage:** Fenwall Crossing, 72×48m island; one twisting ochre road; 10 exact defense pads with 2 available on wave 1, 2 unlock wave 2, 3 unlock wave 4, 3 unlock wave 7. Neutral river at northern map edge, 2 wooden bridges visually but no hidden alternate combat lanes. Cliff elevations purely decorative unless collision is explicitly marked. Light: late-afternoon clear daylight.

**After first vertical slice:** 4 hand-constrained procedural templates (ridge pass, river fork, meadow bridge, quarry bend). Seeded procedural placement of noninteractive rocks, trees, grass clusters, road edge breaks, fences, flowers and dust, with explicit no-overlap near path, pads, spawn/core, camera occlusion tests. Procedural randomization must not change guaranteed first-stage fairness; vary visual detail only at first. Later campaign stages introduce forked waves, gate barricades and alternate routes with explicit mechanics and telegraphs.

Procedural deterministic contract: given game version, map template, seed and settings, navigation, pad positions, decorative geometry, wave schedule and loot payouts are reproducible; stable save state stores these. Seed appears in results UI and can be copied. No unseeded Math.random() in game simulation or mesh generation.

## 9. Feedback and onboarding
Visual hierarchy: enemy path is 4.5m continuous contrasting pale gold. Hero golden mantle. Core desaturated blue slate. Attackers burnt vermilion. A tower costs number hover above a gray pad; affordable costs ivory, unaffordable muted slate, never neon flashing. HUD: top center wave number, upper right copper balance, upper left core durability + hero health, bottom right selected build pad and keys; no fake mobile ad watermark. Core damage: one clear crimson pulse at upper edge (0.2s), subtle camera nudge ≤2px for boss only. Player hit: 0.12s amber rim (not full-screen red blink). Kill: 0.08s squash, drops, tiny dust; avoid gore.

Tutorial uses four short **in-world gestures** with timed dismissal, max 6 words each: MOVE, SHOOTING IS AUTOMATIC, COLLECT CROWNS, BUILD A SPIRE. Max one active instruction at once, disappears after successful input. No forced handholding beyond wave 1.

Sound palette: wooden clack, dry bow twang, small copper ring, short rock crunch, mortar low transient; 100–600ms authored synth envelopes; no stock orchestral epic loops. Optional music later, muted by default for tests. Audio starts only after user gesture.

## 10. UX states and persistence
START → SETTINGS → RUN (with PREP/ACTIVE/RECOVERY substate) → PAUSE → WIN/LOSS → RESTART or SELECT STAGE. No navigation that loses a run silently; prompt before abandoning. Pause on hidden tab and when window loses input focus; simulation time freeze, not cheap catch-up. Save to IndexedDB after each wave and on safe pause, plus lightweight localStorage settings fallback. No user account necessary. Corrupted save shows recover/reset control rather than blank screen.

Results: stage, waves, time, hero damage, tower damage, kills per type, spend categories, max concurrent enemies, seed, restart, back. Data for final scoreboard comes from game simulation, not fabricated placeholder numbers.

## 11. Accessibility, settings and localization readiness
Color categories double-coded by silhouette. Reduced motion removes screen nudges and halves particle count while preserving readable projectile flight. 3 graphic presets, volume controls, render scaling, optional high contrast lane, screen-reader DOM labels for menus/buttons, keyboard focus. WebGL canvas itself is not a full accessibility equivalent; document that limitation and provide configurable difficulty later. Support pointer and touch without double activation. HUD scales with viewport, not fixed screenshot dimensions.

## 12. Success measures / acceptance
A **vertical slice** is real only when a human can complete (or lose) 3 full waves in a browser using movement, auto-fire, pickups, building, and legitimate game-over logic. Required screenshot: natural terrain, textured-by-geometry road, procedurally meshed hero, distinguishable enemies, tower, core, legible price indicators. No colored circles/rectangles masquerading as final art. Measurable: deterministic replay, 100 enemies stable, stable 60fps target at 1080p integrated GPU (measurement necessary; never self-certify), zero uncaught runtime errors, no endless loop, no placeholder text. Full alpha: wave 10 with all taxonomies and 4 tower families.

## 13. Explicit anti-slop veto
Reject any milestone with incoherent geometry, random unrelated shapes, overbright bloom, fluorescent HUD, 2D sprite placeholders claimed as final 3D, random camera shifts, procedural textures with no palette discipline, undifferentiated red blobs, false high-end graphics screenshots, emoji iconography, generic AI-generated fantasy art, or reward popups that hide gameplay. Functionality plus art-direction compliance both required. Detailed measurable rules in `docs/03_ART_AND_ANIMATION_BIBLE.md`.
