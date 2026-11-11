/**
 * F3.01 — deterministic, fixed-step Warden locomotion on Fenwall Crossing.
 * No DOM, camera, renderer or wall-clock dependencies: simulation remains
 * replayable from seed and discrete movement inputs alone.
 *
 * World X east / Z north; WASD axes are expressed in the fixed camera frame.
 * Collision: coastline with hero radius, solid 7×7m keep, and river water
 * except at the two authored bridge crossings. The road/pads remain walkable.
 */
import { BALANCE } from "./Balance";
import { signedCoast, terrainHeight } from "../art/terrain/Island";
import { RIVER_SPEC, riverWaterContains } from "../art/terrain/RiverPath";

export interface MovementInput {
  /** Screen-left / screen-right, finite and clamped to [-1,1]. */
  readonly right: number;
  /** Screen-up / screen-down, finite and clamped to [-1,1]. */
  readonly forward: number;
}
export interface HeroSnapshot {
  readonly tick: number;
  readonly x: number;
  readonly z: number;
  readonly groundY: number;
  readonly vx: number;
  readonly vz: number;
  readonly yaw: number;
  readonly distanceMeters: number;
  readonly speedMetersPerSecond: number;
}

const HERO = BALANCE.hero;
const RIGHT = Math.SQRT1_2;
const START: readonly [number, number] = [23, -3.8];
const KEEP = { minX: 27.5, maxX: 34.5, minZ: -1.5, maxZ: 5.5 } as const;
const COAST_PROBES = 12;
const MAX_STEP = 1 / 30;

function directionInWorld(input: MovementInput): readonly [number, number] {
  if (!Number.isFinite(input.right) || !Number.isFinite(input.forward)) {
    throw new RangeError("Movement input axes must be finite");
  }
  const right = Math.max(-1, Math.min(1, input.right));
  const forward = Math.max(-1, Math.min(1, input.forward));
  const magnitude = Math.hypot(right, forward);
  if (magnitude < 1e-8) return [0, 0];
  const scale = 1 / Math.max(1, magnitude);
  return [(right - forward) * RIGHT * scale, (-right - forward) * RIGHT * scale];
}
function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
function interpolate(from: HeroSnapshot, to: HeroSnapshot, alpha: number): HeroSnapshot {
  return Object.freeze({
    tick: to.tick,
    x: from.x + (to.x - from.x) * alpha,
    z: from.z + (to.z - from.z) * alpha,
    groundY: from.groundY + (to.groundY - from.groundY) * alpha,
    vx: from.vx + (to.vx - from.vx) * alpha,
    vz: from.vz + (to.vz - from.vz) * alpha,
    yaw: from.yaw + angleDelta(from.yaw, to.yaw) * alpha,
    distanceMeters: from.distanceMeters + (to.distanceMeters - from.distanceMeters) * alpha,
    speedMetersPerSecond: from.speedMetersPerSecond
      + (to.speedMetersPerSecond - from.speedMetersPerSecond) * alpha,
  });
}

export class HeroMovementWorld {
  private current: HeroSnapshot;
  private previous: HeroSnapshot;

  constructor(
    private readonly seed: string | number = "fenwall-crossing-v1",
    spawnX = START[0], spawnZ = START[1],
  ) {
    if (!this.canOccupy(spawnX, spawnZ)) {
      throw new RangeError("Warden spawn is outside safe walkable ground");
    }
    this.current = Object.freeze({
      tick: 0, x: spawnX, z: spawnZ, groundY: terrainHeight(seed, spawnX, spawnZ),
      vx: 0, vz: 0, yaw: Math.PI * 0.72,
      distanceMeters: 0, speedMetersPerSecond: 0,
    });
    this.previous = this.current;
  }

  get snapshot(): HeroSnapshot { return this.current; }

  /** Four-second respawn at the authored safe gate, never rewinding the tick. */
  respawnAtCore():HeroSnapshot {
    if(!this.canOccupy(START[0],START[1]))
      throw new Error("Authored respawn is no longer safely walkable");
    this.current=Object.freeze({...this.current,
      x:START[0],z:START[1],
      groundY:terrainHeight(this.seed,START[0],START[1]),
      vx:0,vz:0,speedMetersPerSecond:0,yaw:Math.PI*0.72,
    });
    this.previous=this.current;
    return this.current;
  }

  /** Interpolated render-only sample, never fed back into physics. */
  sample(alpha: number): HeroSnapshot {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new RangeError("Interpolation alpha must be in [0,1]");
    }
    return interpolate(this.previous, this.current, alpha);
  }

  /** Advance only from the fixed 60Hz engine callback. */
  step(input: MovementInput, dt: number): HeroSnapshot {
    if (!Number.isFinite(dt) || dt <= 0 || dt > MAX_STEP) {
      throw new RangeError("Movement timestep must be a positive fixed-sized interval");
    }
    const [dx, dz] = directionInWorld(input);
    const active = Math.hypot(dx, dz) > 0;
    const desiredVX = dx * HERO.speedMetersPerSecond;
    const desiredVZ = dz * HERO.speedMetersPerSecond;
    const vxError = desiredVX - this.current.vx;
    const vzError = desiredVZ - this.current.vz;
    const difference = Math.hypot(vxError, vzError);
    const maxChange = (active
      ? HERO.accelerationMetersPerSecondSquared
      : HERO.decelerationMetersPerSecondSquared) * dt;
    const fraction = difference > maxChange ? maxChange / difference : 1;
    let vx = this.current.vx + vxError * fraction;
    let vz = this.current.vz + vzError * fraction;

    let x = this.current.x, z = this.current.z;
    const candidateX = x + vx * dt;
    const candidateZ = z + vz * dt;
    if (this.canOccupy(candidateX, candidateZ)) {
      x = candidateX; z = candidateZ;
    } else {
      // Axis projection gives a smooth wall slide without a full physics engine.
      if (this.canOccupy(candidateX, z)) x = candidateX;
      else vx = 0;
      if (this.canOccupy(x, candidateZ)) z = candidateZ;
      else vz = 0;
    }
    const speed = Math.hypot(vx, vz);
    const yawTarget = speed > 0.12 ? Math.atan2(-vx, -vz) : this.current.yaw;
    const yaw = this.current.yaw + angleDelta(this.current.yaw, yawTarget)
      * -Math.expm1(-dt / 0.10);
    this.previous = this.current;
    this.current = Object.freeze({
      tick: this.current.tick + 1,
      x, z, groundY: terrainHeight(this.seed, x, z), vx, vz, yaw,
      distanceMeters: this.current.distanceMeters
        + Math.hypot(x - this.previous.x, z - this.previous.z),
      speedMetersPerSecond: speed,
    });
    return this.current;
  }

  /** Radius-safe collision on authored island and static world landmarks. */
  canOccupy(x: number, z: number): boolean {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    const radius = HERO.radiusMeters;
    for (let n = 0; n < COAST_PROBES; n++) {
      const angle = n * Math.PI * 2 / COAST_PROBES;
      if (signedCoast(x + radius * Math.cos(angle),
        z + radius * Math.sin(angle)) > 0) return false;
    }
    const nearestX = Math.max(KEEP.minX, Math.min(KEEP.maxX, x));
    const nearestZ = Math.max(KEEP.minZ, Math.min(KEEP.maxZ, z));
    if (Math.hypot(x - nearestX, z - nearestZ) < radius) return false;
    // River belongs to scenery, but the player cannot walk beneath its water.
    // Leave 2.2m either side of each wooden bridge navigable.
    for (const offset of [-radius, 0, radius]) {
      if (riverWaterContains(x, z + offset)
        && RIVER_SPEC.bridgeXs.every(bridgeX => Math.abs(x - bridgeX) > 2.2)) {
        return false;
      }
    }
    return true;
  }
}
