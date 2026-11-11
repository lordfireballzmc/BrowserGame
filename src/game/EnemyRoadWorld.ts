/**
 * F3.02 — deterministic first-wave enemy spawn queues and road-lane movement.
 * Pure fixed-tick simulation: no wall clock, DOM, WebGL, mutable RNG or GPU.
 * F3.04c1 extends the real road to three authored waves with directional
 * shield defense. Later roles and the full ten-wave campaign remain open.
 * F3.03 preserves damage and a downed actor state across ticks for real bolts. Raiders stop visibly at a safe gate staging point, NOT
 * inside the solid keep. No invented core damage or victory conditions.
 */
import { BALANCE, type EnemyKind } from "./Balance";
import {
  ROAD_LENGTH_METERS, ROAD_SPEC, roadPointAtDistance,
} from "../art/terrain/RoadPath";
import { terrainHeight } from "../art/terrain/Island";
import { FIXED_STEP_SECONDS } from "../engine/Loop";

export type EarlyEnemyKind = Extract<EnemyKind, "scrapper" | "runner" | "shieldbearer">;
export type EarlyWave = 1 | 2 | 3;

export interface EnemySpawn {
  readonly id: number;
  readonly kind: EarlyEnemyKind;
  readonly spawnTick: number;
  /** Deterministic left/right road-shoulder offset, meters. */
  readonly laneOffset: number;
  /** Longitudinal queue slot at the gate, avoids piled-up overlapping actors. */
  readonly gateHoldBackMeters: number;
}
export interface RoadEnemy {
  readonly id: number;
  readonly kind: EarlyEnemyKind;
  readonly spawnTick: number;
  readonly hp: number;
  /** Last authoritative fixed tick in which a bolt actually hit this actor. */
  readonly hitTick: number | null;
  readonly maxHp: number;
  readonly contactDamagePerSecond: number;
  readonly strikeIntervalSeconds: number;
  readonly damagePerStrike: number;
  readonly speedMetersPerSecond: number;
  readonly distanceMeters: number;
  readonly laneOffset: number;
  readonly gateHoldBackMeters: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Radians for character whose forward is -Z. */
  readonly yaw: number;
  readonly phase: "advancing" | "holding-at-gate" | "downed";
}
export interface EnemyWorldSnapshot {
  readonly tick: number;
  readonly enemies: readonly RoadEnemy[];
  readonly pending: number;
  readonly spawned: number;
  readonly arrived: number;
}

const STRIKE_INTERVAL_SECONDS = 0.6;
const MAX_RETAINED_ENEMIES = 100;
const GATE_STAGING_GAP = 6.0;
export const GATE_STAGING_DISTANCE_METERS = ROAD_LENGTH_METERS - GATE_STAGING_GAP;
export const MAX_SPAWNS_PER_SECOND = 6;

function assertEarlyWave(value: number): asserts value is EarlyWave {
  if (value !== 1 && value !== 2 && value !== 3)
    throw new RangeError("Only authored waves 1 through 3 are available");
}
function entry(kind: EarlyEnemyKind, spawnTick: number) {
  return { kind, spawnTick };
}

/** Stable, finite authored 20–40s scripts; early waves have no randomness. */
export function buildEarlySpawnQueue(wave: EarlyWave): readonly EnemySpawn[] {
  assertEarlyWave(wave);
  const schedule: { kind: EarlyEnemyKind; spawnTick: number }[] = [];
  if (wave === 1) {
    for (let i = 0; i < 10; i++) schedule.push(entry("scrapper", i * 120));
  } else if (wave === 2) {
    for (let i = 0; i < 14; i++) schedule.push(entry("scrapper", i * 90));
    for (let i = 0; i < 5; i++) schedule.push(entry("runner", 90 + i * 225));
  } else {
    // First genuine mixed-column assault. Heavy shields appear after the
    // opening raiders so players can reposition around their protected front.
    // This is real authored 60Hz gameplay, never a visual-only enemy overlay.
    for (let i = 0; i < 18; i++) schedule.push(entry("scrapper", i * 120));
    for (let i = 0; i < 8; i++) schedule.push(entry("runner", 120 + i * 270));
    for (let i = 0; i < 3; i++) schedule.push(entry("shieldbearer", 360 + i * 570));
  }
  const order:Readonly<Record<EarlyEnemyKind,number>>={
    scrapper:0,shieldbearer:1,runner:2,
  };
  schedule.sort((a, b) =>
    a.spawnTick - b.spawnTick || order[a.kind]-order[b.kind]);
  if (schedule.length > MAX_RETAINED_ENEMIES) {
    throw new RangeError("Script exceeds enemy entity budget");
  }
  const holdingSlots = new Map<string,number>();
  const result = schedule.map((item, index): EnemySpawn => {
    // Distinct shoulders: quick flankers to the south, heavy shields north.
    const lane = item.kind === "runner" ? -0.92
      : item.kind === "shieldbearer" ? 0.92
      : [-0.46, 0, 0.46][index % 3]!;
    const key = item.kind + ":" + lane;
    const rank = holdingSlots.get(key) ?? 0;
    holdingSlots.set(key, rank+1);
    return Object.freeze({
      id: index+1, ...item, laneOffset: lane,
      gateHoldBackMeters: rank*1.20,
    });
  });
  // Verify this authored schedule's maximum one-second burst budget.
  for (let i = 0; i < result.length; i++) {
    let count = 0;
    for (let j = i; j < result.length &&
      result[j]!.spawnTick < result[i]!.spawnTick + 60; j++) count++;
    if (count > MAX_SPAWNS_PER_SECOND) throw new Error("Spawn rate exceeds six per second");
  }
  return Object.freeze(result);
}

/** Reconstruct location from distance, never integrate X/Z independently. */
export function locateRoadEnemy(
  distanceMeters: number,
  offsetMeters: number,
  seed: string | number,
): Readonly<{ x: number; y: number; z: number; yaw: number }> {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(offsetMeters) ||
    distanceMeters < 0 || distanceMeters > GATE_STAGING_DISTANCE_METERS ||
    Math.abs(offsetMeters) > ROAD_SPEC.halfWidthMeters - 0.55) {
    throw new RangeError("Road enemy is outside the authored safe lane");
  }
  const route = roadPointAtDistance(distanceMeters);
  const x = route.x - route.tangent[1] * offsetMeters;
  const z = route.z + route.tangent[0] * offsetMeters;
  return {
    x, z, y: terrainHeight(seed, x, z) + 0.035,
    yaw: Math.atan2(-route.tangent[0], -route.tangent[1]),
  };
}
function makeEnemy(
  spawn: EnemySpawn, distance: number, seed: string | number,
  hp: number = BALANCE.enemies[spawn.kind].health,
  hitTick: number | null = null,
): RoadEnemy {
  const config = BALANCE.enemies[spawn.kind];
  return Object.freeze({
    ...spawn,
    hp, hitTick,
    maxHp: config.health,
    contactDamagePerSecond: config.contactDamagePerSecond,
    strikeIntervalSeconds: STRIKE_INTERVAL_SECONDS,
    damagePerStrike: config.contactDamagePerSecond * STRIKE_INTERVAL_SECONDS,
    speedMetersPerSecond: config.speedMetersPerSecond,
    distanceMeters: distance,
    ...locateRoadEnemy(distance, spawn.laneOffset, seed),
    phase: hp <= 0 ? "downed" as const
      : distance >= GATE_STAGING_DISTANCE_METERS - spawn.gateHoldBackMeters - 1e-8
        ? "holding-at-gate" as const : "advancing" as const,
  });
}
function frozenSnapshot(
  tick: number, enemies: readonly RoadEnemy[], queueSize: number,
): EnemyWorldSnapshot {
  const sorted = Object.freeze(enemies);
  const arrived = sorted.filter(e => e.phase === "holding-at-gate").length;
  return Object.freeze({
    tick, enemies: sorted, pending: queueSize - sorted.length,
    spawned: sorted.length, arrived,
  });
}
function blendAngle(a: number, b: number, t: number): number {
  return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
}

/**
 * F3.04c1: physically directional Shieldbearer armor.
 * Source position is the bolt's world-space location on its swept impact
 * segment. The front 120-degree arc (dot >= 0.5) absorbs 45% damage.
 * Rear/flanking hits and every other enemy retain canonical raw damage.
 * Tests/scripts with no physical shot source remain exact raw damage.
 */
export function resolveProjectileDamage(
  enemy:Readonly<Pick<RoadEnemy,"kind"|"x"|"z"|"yaw">>,
  rawDamage:number,source?:Readonly<{x:number;z:number}>,
):number {
  if(!Number.isSafeInteger(rawDamage)||rawDamage<=0)
    throw new RangeError("Impact damage must be a positive integer");
  if(enemy.kind!=="shieldbearer"||!source)return rawDamage;
  if(!Number.isFinite(source.x)||!Number.isFinite(source.z))
    throw new RangeError("Projectile source must have finite world coordinates");
  const dx=source.x-enemy.x,dz=source.z-enemy.z;
  const length=Math.hypot(dx,dz);
  if(length<1e-6)return rawDamage; // degenerate impact cannot infer an arc
  const facingX=-Math.sin(enemy.yaw),facingZ=-Math.cos(enemy.yaw);
  const fromFront=(facingX*dx+facingZ*dz)/length>=0.5;
  return fromFront?Math.max(1,Math.round(rawDamage*0.55)):rawDamage;
}

/** Headless authoritative enemy-state owner; sample(alpha) is visual only. */
export class EnemyRoadWorld {
  readonly queue: readonly EnemySpawn[];
  private current: EnemyWorldSnapshot;
  private previous: EnemyWorldSnapshot;
  private spawningEnabled=true;
  private spawnBaseTick=0;

  constructor(
    readonly wave: EarlyWave = 1,
    readonly seed: string | number = "fenwall-crossing-v1",
  ) {
    this.queue = buildEarlySpawnQueue(wave);
    this.current = frozenSnapshot(0, [], this.queue.length);
    this.previous = this.current;
  }
  get snapshot(): EnemyWorldSnapshot { return this.current; }

  /** F3.04b: preparation freezes the authored queue, NOT the 60Hz clock.
   * Re-enabling spawns preserves all source intervals relative to the start
   * of the active phase. Default behavior stays unchanged for F3.02 probes. */
  setWaveActive(enabled:boolean):void {
    if(enabled && !this.spawningEnabled){
      this.spawnBaseTick=this.current.tick;
    }
    this.spawningEnabled=enabled;
  }

  step(dtSeconds: number): EnemyWorldSnapshot {
    if (!Number.isFinite(dtSeconds) || Math.abs(dtSeconds - FIXED_STEP_SECONDS) > 1e-10) {
      throw new RangeError("EnemyWorld requires the authoritative 60Hz fixed step");
    }
    const nextTick = this.current.tick + 1;
    const next: RoadEnemy[] = this.current.enemies.map(enemy => makeEnemy(
      this.queue[enemy.id - 1]!,
      enemy.hp === 0 ? enemy.distanceMeters
        : Math.min(GATE_STAGING_DISTANCE_METERS -
            this.queue[enemy.id - 1]!.gateHoldBackMeters,
          enemy.distanceMeters + enemy.speedMetersPerSecond * dtSeconds),
      this.seed, enemy.hp, enemy.hitTick,
    ));
    if(this.spawningEnabled)for (const scheduled of this.queue) {
      if (scheduled.id <= this.current.spawned) continue;
      if (scheduled.spawnTick+this.spawnBaseTick >= nextTick) break;
      next.push(makeEnemy(scheduled, 0, this.seed));
    }
    this.previous = this.current;
    this.current = frozenSnapshot(nextTick, next, this.queue.length);
    return this.current;
  }

  /**
   * Apply actual positive integer projectile damage to one stable entity ID.
   * F3.04 will own kill payouts and removal; this state only stops a defeated
   * raider and prevents further targeting. Never respawn or restore its HP.
   */
  applyBoltDamage(enemyId: number, damage: number,
    projectileSource?:Readonly<{x:number;z:number}>): number {
    if (!Number.isInteger(enemyId) || enemyId < 1
      || !Number.isInteger(damage) || damage <= 0) {
      throw new RangeError("Bolt damage requires a valid ID and positive integer damage");
    }
    const old = this.current.enemies.find(enemy => enemy.id === enemyId);
    if (!old || old.hp === 0) return 0;
    // Shieldbearer frontal armor is computed from the REAL incoming world
    // projectile direction at impact, never from a fake visual state.
    const actual = Math.min(old.hp,
      resolveProjectileDamage(old,damage,projectileSource));
    const next = this.current.enemies.map(enemy => enemy.id !== enemyId
      ? enemy
      : Object.freeze({
          ...enemy, hp: enemy.hp - actual, hitTick: this.current.tick,
          phase: enemy.hp - actual === 0 ? "downed" as const : enemy.phase,
        }));
    this.current = frozenSnapshot(this.current.tick, next, this.queue.length);
    return actual;
  }

  /** Interpolate distance and a shortest-arc yaw. Never mutate a saved tick. */
  sample(alpha: number): EnemyWorldSnapshot {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new RangeError("Enemy interpolation alpha must be in [0,1]");
    }
    const prior = new Map(this.previous.enemies.map(e => [e.id, e]));
    const enemies = this.current.enemies.map(e => {
      const before = prior.get(e.id);
      if (!before) return e; // no teleport from a nonexistent actor
      const distance = before.distanceMeters +
        (e.distanceMeters - before.distanceMeters) * alpha;
      const placement = locateRoadEnemy(distance, e.laneOffset, this.seed);
      return Object.freeze({
        ...e, distanceMeters: distance, x: placement.x, y: placement.y,
        z: placement.z, yaw: blendAngle(before.yaw, e.yaw, alpha),
        phase: alpha < 1 ? before.phase : e.phase,
      });
    });
    return frozenSnapshot(this.current.tick, enemies, this.queue.length);
  }
}
