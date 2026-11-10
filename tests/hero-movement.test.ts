import { describe, expect, it } from "vitest";
import { HeroMovementWorld } from "../src/game/HeroMovement";
import { FIXED_STEP_SECONDS } from "../src/engine/Loop";
import { BALANCE } from "../src/game/Balance";

const step = (world: HeroMovementWorld, right: number, forward: number, frames = 1) => {
  for (let i = 0; i < frames; i++) {
    world.step({ right, forward }, FIXED_STEP_SECONDS);
  }
};

describe("F3.01 deterministic Warden locomotion", () => {
  it("uses design-bible 4.2m/s speed, normalizes diagonal and rotates with camera", () => {
    const ahead = new HeroMovementWorld();
    const diagonal = new HeroMovementWorld();
    const strafing = new HeroMovementWorld();
    step(ahead, 0, 1, 90);
    step(diagonal, 1, 1, 90);
    step(strafing, 1, 0, 90);
    const traveled = (world: HeroMovementWorld) => Math.hypot(world.snapshot.x-23,world.snapshot.z+3.8);
    expect(traveled(diagonal)).toBeCloseTo(traveled(ahead), 4);
    expect(traveled(strafing)).toBeCloseTo(traveled(ahead), 4);
    expect(ahead.snapshot.x).toBeLessThan(23);
    expect(ahead.snapshot.z).toBeLessThan(-3.8);
    expect(diagonal.snapshot.z).toBeLessThan(-3.8);
    expect(diagonal.snapshot.x).toBeCloseTo(23, 4);
    expect(ahead.snapshot.speedMetersPerSecond).toBeCloseTo(
      BALANCE.hero.speedMetersPerSecond, 6,
    );
    expect(ahead.snapshot.tick).toBe(90);
  });

  it("accelerates and stops gradually without overshooting or drifting forever", () => {
    const world = new HeroMovementWorld();
    const first = world.step({right:1,forward:0},FIXED_STEP_SECONDS);
    expect(first.speedMetersPerSecond).toBeCloseTo(16/60, 6);
    step(world,1,0,50);
    expect(world.snapshot.speedMetersPerSecond).toBeCloseTo(4.2,6);
    const running=world.snapshot;
    step(world,0,0,30);
    expect(world.snapshot.speedMetersPerSecond).toBe(0);
    const stopped=world.snapshot;
    step(world,0,0,60);
    expect(world.snapshot.x).toBe(stopped.x);
    expect(world.snapshot.z).toBe(stopped.z);
    expect(running.speedMetersPerSecond).toBeCloseTo(4.2, 8);
  });

  it("enforces coastline radius, a solid keep and bridge-only river crossings", () => {
    const world=new HeroMovementWorld();
    expect(world.canOccupy(0,0)).toBe(true);
    expect(world.canOccupy(31,2)).toBe(false);
    expect(world.canOccupy(27.2,2)).toBe(false);
    expect(world.canOccupy(36,0)).toBe(false);
    expect(world.canOccupy(0,19)).toBe(false);
    expect(world.canOccupy(16,19)).toBe(true);
    expect(world.canOccupy(-16,19)).toBe(true);
    expect(world.canOccupy(NaN,0)).toBe(false);
    expect(() => new HeroMovementWorld("fenwall-crossing-v1",31,2)).toThrow();
  });

  it("slides along the keep wall without entering its 7×7m solid footprint", () => {
    const world=new HeroMovementWorld("fenwall-crossing-v1",25,0);
    step(world,Math.SQRT1_2,-Math.SQRT1_2,180);
    expect(world.snapshot.x).toBeGreaterThan(25);
    expect(world.snapshot.x).toBeLessThanOrEqual(26.96);
    expect(world.snapshot.z).toBeCloseTo(0,5);
    expect(world.canOccupy(world.snapshot.x,world.snapshot.z)).toBe(true);
  });

  it("stays on the island near the eastern coastline after repeated moves", () => {
    const world=new HeroMovementWorld("fenwall-crossing-v1",34,-10);
    step(world,Math.SQRT1_2,-Math.SQRT1_2,240);
    expect(world.snapshot.x).toBeLessThan(36);
    expect(world.canOccupy(world.snapshot.x,world.snapshot.z)).toBe(true);
  });

  it("produces frozen historical snapshots and smooth render interpolation", () => {
    const world=new HeroMovementWorld();
    const before=world.snapshot;
    const after=world.step({right:0,forward:1},FIXED_STEP_SECONDS);
    const half=world.sample(0.5);
    expect(half.x).toBeCloseTo((before.x+after.x)/2,7);
    expect(half.z).toBeCloseTo((before.z+after.z)/2,7);
    expect(world.sample(1).x).toBe(after.x);
    expect(world.sample(0).x).toBe(before.x);
    expect(Object.isFrozen(before)).toBe(true);
    expect(Object.isFrozen(after)).toBe(true);
    expect(Object.isFrozen(half)).toBe(true);
    expect(before.tick).toBe(0);
    expect(after.tick).toBe(1);
    expect(() => world.sample(-1)).toThrow(RangeError);
  });

  it("rejects invalid movement input and timesteps before mutating state", () => {
    const world=new HeroMovementWorld();
    const before=world.snapshot;
    expect(() => world.step({right:NaN,forward:1},FIXED_STEP_SECONDS)).toThrow();
    expect(() => world.step({right:0,forward:0},0)).toThrow();
    expect(() => world.step({right:0,forward:0},0.5)).toThrow();
    expect(world.snapshot).toBe(before);
  });
});
