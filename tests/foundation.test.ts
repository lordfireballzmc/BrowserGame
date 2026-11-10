import { describe, expect, it } from "vitest";
import { BALANCE, ENEMY_KINDS, TOWER_KINDS, upgradeCostCrowns } from "../src/game/Balance";
import { RNG_VERSION, SeededRandom, seedToUint32 } from "../src/game/Random";

describe("xorshift32 v1 reproducibility contract", () => {
  it("keeps its algorithm version explicit", () => {
    expect(RNG_VERSION).toBe(1);
  });

  it("produces known integer-seed golden vectors", () => {
    const rng = new SeededRandom(1);
    expect(Array.from({ length: 6 }, () => rng.nextUint32())).toEqual([
      270369, 67634689, 2647435461, 307599695, 2398689233, 745495504,
    ]);
  });

  it("hashes strings identically and reproduces golden vectors", () => {
    expect(seedToUint32("fenwall")).toBe(2428685854);
    const rng = new SeededRandom("fenwall");
    expect(Array.from({ length: 4 }, () => rng.nextUint32())).toEqual([
      3911989598, 2935883261, 2792606077, 886889651,
    ]);
  });

  it("handles zero seeds without trapping the generator", () => {
    const rng = new SeededRandom(0);
    expect(rng.nextUint32()).toBe(1085196063);
    expect(new SeededRandom(0).nextUint32()).toBe(1085196063);
  });

  it("replays the exact next values from a saved snapshot", () => {
    const rng = new SeededRandom("savegame-A");
    rng.nextUint32();
    const state = rng.snapshot();
    const expected = [rng.nextUint32(), rng.nextFloat(), rng.nextIntInclusive(2, 3)];
    rng.restore(state);
    expect([rng.nextUint32(), rng.nextFloat(), rng.nextIntInclusive(2, 3)]).toEqual(expected);
  });

  it("generates finite floats within [0, 1) and inclusive bounded ints", () => {
    const rng = new SeededRandom(123456789);
    const coins = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const f = rng.nextFloat();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const crown = rng.nextIntInclusive(2, 3);
      expect([2, 3]).toContain(crown);
      coins.add(crown);
    }
    expect(coins).toEqual(new Set([2, 3]));
  });

  it("rejects unsafe seeds, invalid ranges, and zero restore state", () => {
    expect(() => new SeededRandom(0.5)).toThrow(RangeError);
    const rng = new SeededRandom(1);
    expect(() => rng.restore(0)).toThrow(RangeError);
    expect(() => rng.nextIntInclusive(7, 2)).toThrow(RangeError);
    expect(() => rng.nextIntInclusive(0, 4294967296)).toThrow(RangeError);
  });
});

describe("canonical game balance", () => {
  it("specifies all six enemy roles and four tower families", () => {
    expect(Object.keys(BALANCE.enemies).sort()).toEqual([...ENEMY_KINDS].sort());
    expect(Object.keys(BALANCE.towers).sort()).toEqual([...TOWER_KINDS].sort());
  });

  it("keeps specified stats positive and reward bounds integral", () => {
    for (const enemy of Object.values(BALANCE.enemies)) {
      expect(enemy.health).toBeGreaterThan(0);
      expect(enemy.speedMetersPerSecond).toBeGreaterThan(0);
      expect(Number.isSafeInteger(enemy.crownDropMin)).toBe(true);
      expect(enemy.crownDropMax).toBeGreaterThanOrEqual(enemy.crownDropMin);
    }
    expect(BALANCE.hero.health).toBe(100);
    expect(BALANCE.core.health).toBe(300);
    expect(BALANCE.economy.startingCrowns).toBe(25);
  });

  it("calculates integer upgrade prices without mutation", () => {
    expect(upgradeCostCrowns("boltSpire", 2)).toBe(14);
    expect(upgradeCostCrowns("boltSpire", 3)).toBe(26);
    expect(upgradeCostCrowns("arrowRack", 2)).toBe(25);
    expect(upgradeCostCrowns("signalWard", 3)).toBe(59);
  });

  it("does not give the Signal Ward a projectile attack", () => {
    expect(BALANCE.towers.signalWard.attackIntervalSeconds).toBeNull();
    expect(BALANCE.towers.signalWard.projectilesPerAttack).toBe(0);
  });
});
