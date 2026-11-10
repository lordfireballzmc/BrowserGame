/**
 * F3.02 — deterministic first-wave enemy spawn queues and road-lane movement.
 * Pure fixed-tick simulation: no wall clock, DOM, WebGL, mutable RNG or GPU.
 * Wave progression, damage application, projectile hits and deaths belong to
 * later F3 tasks. Raiders stop visibly at a safe gate staging point, NOT
 * inside the solid keep. No invented core damage or victory conditions.
 */
import { BALANCE, type EnemyKind } from "./Balance";
import {
  ROAD_LENGTH_METERS, ROAD_SPEC, roadPointAtDistance,
} from "../art/terrain/RoadPath";
import { terrainHeight } from "../art/terrain/Island";
import { FIXED_STEP_SECONDS } from "../engine/Loop";

export type EarlyEnemyKind = Extract<EnemyKind, "scrapper" | "runner">;
export type EarlyWave = 1 | 2;

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
  readonly maxHp: number;
  readonly contactDamagePerSecond: number;
  readonly strikeIntervalSeconds: number;
  readonly damagePerStrike: number;
  readonly speedMetersPerSecond: number;
  readonly distanceMeters: number;
  readonly laneOffset: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Radians for character whose forward is -Z. */
  readonly yaw: number;
  readonly phase: "advancing" | "holding-at-gate";
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
  if (value !== 1 && value !== 2) throw new RangeError("Only authored waves 1 and 2 are available");
}
function entry(kind: EarlyEnemyKind, spawnTick: number) {
  return { kind, spawnTick };
}

/** Stable, finite authored 20-second scripts; early waves have no randomness. */
export function buildEarlySpawnQueue(wave: EarlyWave): readonly EnemySpawn[] {
  assertEarlyWave(wave);
  const schedule: { kind: EarlyEnemyKind; spawnTick: number }[] = [];
  if (wave === 1) {
    for (let i = 0; i < 10; i++) schedule.push(entry("scrapper", i * 120));
  } else {
    for (let i = 0; i < 14; i++) schedule.push(entry("scrapper", i * 90));
    for (let i = 0; i < 5; i++) schedule.push(entry("runner", 90 + i * 225));
  }
  schedule.sort((a, b) =>
    a.spawnTick - b.spawnTick ||
    (a.kind === b.kind ? 0 : a.kind === "scrapper" ? -1 : 1));
  if (schedule.length > MAX_RETAINED_ENEMIES) {
    throw new RangeError("Script exceeds enemy entity budget");
  }
  const holdingSlots = new Map<string,number>();
  const result = schedule.map((item, index): EnemySpawn => {
    // Three permanent Scrapper bands and one faster Runner shoulder.
    const lane = item.kind === "runner" ? -0.92 : [-0.46, 0, 0.46][index % 3]!;
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
): RoadEnemy {
  const config = BALANCE.enemies[spawn.kind];
  return Object.freeze({
    ...spawn,
    hp: config.health,
    maxHp: config.health,
    contactDamagePerSecond: config.contactDamagePerSecond,
    strikeIntervalSeconds: STRIKE_INTERVAL_SECONDS,
    damagePerStrike: config.contactDamagePerSecond * STRIKE_INTERVAL_SECONDS,
    speedMetersPerSecond: config.speedMetersPerSecond,
    distanceMeters: distance,
    ...locateRoadEnemy(distance, spawn.laneOffset, seed),
    phase: distance >= GATE_STAGING_DISTANCE_METERS - spawn.gateHoldBackMeters - 1e-8
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

/** Headless authoritative enemy-state owner; sample(alpha) is visual only. */
export class EnemyRoadWorld {
  readonly queue: readonly EnemySpawn[];
  private current: EnemyWorldSnapshot;
  private previous: EnemyWorldSnapshot;

  constructor(
    readonly wave: EarlyWave = 1,
    private readonly seed: string | number = "fenwall-crossing-v1",
  ) {
    this.queue = buildEarlySpawnQueue(wave);
    this.current = frozenSnapshot(0, [], this.queue.length);
    this.previous = this.current;
  }
  get snapshot(): EnemyWorldSnapshot { return this.current; }

  step(dtSeconds: number): EnemyWorldSnapshot {
    if (!Number.isFinite(dtSeconds) || Math.abs(dtSeconds - FIXED_STEP_SECONDS) > 1e-10) {
      throw new RangeError("EnemyWorld requires the authoritative 60Hz fixed step");
    }
    const nextTick = this.current.tick + 1;
    const next: RoadEnemy[] = this.current.enemies.map(enemy => makeEnemy(
      this.queue[enemy.id - 1]!,
      Math.min(GATE_STAGING_DISTANCE_METERS -
          this.queue[enemy.id - 1]!.gateHoldBackMeters,
        enemy.distanceMeters + enemy.speedMetersPerSecond * dtSeconds),
      this.seed,
    ));
    for (const scheduled of this.queue) {
      if (scheduled.id <= this.current.spawned) continue;
      if (scheduled.spawnTick >= nextTick) break;
      next.push(makeEnemy(scheduled, 0, this.seed));
    }
    this.previous = this.current;
    this.current = frozenSnapshot(nextTick, next, this.queue.length);
    return this.current;
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
