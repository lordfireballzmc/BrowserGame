import { describe, expect, it } from "vitest";
import { EnemyRoadWorld, buildEarlySpawnQueue, locateRoadEnemy,
  GATE_STAGING_DISTANCE_METERS, MAX_SPAWNS_PER_SECOND,
} from "../src/game/EnemyRoadWorld";
import { BALANCE } from "../src/game/Balance";
import { FIXED_STEP_SECONDS } from "../src/engine/Loop";
import { ROAD_LENGTH_METERS, ROAD_SPEC, nearestRoadPoint } from "../src/art/terrain/RoadPath";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { createRunnerStudy } from "../src/art/models/RunnerStudy";

function step(world: EnemyRoadWorld, count: number): void {
  for (let i = 0; i < count; i++) world.step(FIXED_STEP_SECONDS);
}

describe("F3.02 deterministic real-path raiders", () => {
  it("scripts exactly ten wave-1 Scrappers and fourteen Scrappers plus five Runners in wave 2", () => {
    for (const [wave, scrappers, runners] of [[1,10,0],[2,14,5]] as const) {
      const queue = buildEarlySpawnQueue(wave);
      expect(queue).toHaveLength(scrappers+runners);
      expect(queue.filter(q=>q.kind==="scrapper")).toHaveLength(scrappers);
      expect(queue.filter(q=>q.kind==="runner")).toHaveLength(runners);
      expect(queue.map(q=>q.id)).toEqual(queue.map((_,i)=>i+1));
      expect(Object.isFrozen(queue)).toBe(true);
      expect(queue.every(q=>Object.isFrozen(q))).toBe(true);
      for (let i=0;i<queue.length;i++) {
        expect(queue[i]!.spawnTick).toBeGreaterThanOrEqual(i?queue[i-1]!.spawnTick:0);
        const burst=queue.filter(q=>q.spawnTick>=queue[i]!.spawnTick &&
          q.spawnTick<queue[i]!.spawnTick+60).length;
        expect(burst).toBeLessThanOrEqual(MAX_SPAWNS_PER_SECOND);
        expect(Math.abs(queue[i]!.laneOffset)).toBeLessThan(ROAD_SPEC.halfWidthMeters-0.55);
      }
    }
    // F3.04c1 added genuine third-wave Shields; wave four is not authored.
    expect(() => buildEarlySpawnQueue(4 as 1)).toThrow(RangeError);
  });

  it("uses exact balance health, speeds and per-strike damage without fabricating attacks", () => {
    const world=new EnemyRoadWorld(2);
    step(world,100);
    const scrapper=world.snapshot.enemies.find(e=>e.kind==="scrapper")!;
    const runner=world.snapshot.enemies.find(e=>e.kind==="runner")!;
    for (const enemy of [scrapper,runner]) {
      const numeric=BALANCE.enemies[enemy.kind];
      expect(enemy.maxHp).toBe(numeric.health);
      expect(enemy.hp).toBe(numeric.health);
      expect(enemy.speedMetersPerSecond).toBe(numeric.speedMetersPerSecond);
      expect(enemy.contactDamagePerSecond).toBe(numeric.contactDamagePerSecond);
      expect(enemy.strikeIntervalSeconds).toBeCloseTo(0.6,10);
      expect(enemy.damagePerStrike).toBeCloseTo(numeric.contactDamagePerSecond*0.6,8);
      expect(enemy.phase).toBe("advancing");
    }
    expect(world.snapshot.pending).toBe(16);
  });

  it("moves by distance in 60Hz ticks, remains on the existing 4.5m lane", () => {
    const world=new EnemyRoadWorld(2);
    step(world,151);
    const scrapper=world.snapshot.enemies.find(e=>e.id===1)!;
    const runner=world.snapshot.enemies.find(e=>e.kind==="runner")!;
    expect(scrapper.distanceMeters).toBeCloseTo(150*1.8/60,8);
    expect(runner.distanceMeters).toBeCloseTo(60*3.4/60,8);
    for (const enemy of world.snapshot.enemies) {
      const nearest=nearestRoadPoint(enemy.x,enemy.z);
      expect(nearest.lateralDistance).toBeLessThan(1.05);
      expect(nearest.withinLane).toBe(true);
      expect(enemy.y).toBeGreaterThan(-1);
      expect(Number.isFinite(enemy.yaw)).toBe(true);
    }
  });

  it("is deterministic for identical wave and seed and differs for different wave scripts", () => {
    const a=new EnemyRoadWorld(2,"fenwall-crossing-v1");
    const b=new EnemyRoadWorld(2,"fenwall-crossing-v1");
    const c=new EnemyRoadWorld(1,"fenwall-crossing-v1");
    step(a,900); step(b,900); step(c,900);
    expect(a.snapshot).toEqual(b.snapshot);
    expect(a.snapshot.spawned).toBe(14);
    expect(c.snapshot.spawned).toBe(8);
    expect(a.snapshot).not.toEqual(c.snapshot);
    expect(Object.isFrozen(a.snapshot)).toBe(true);
    expect(Object.isFrozen(a.snapshot.enemies)).toBe(true);
    expect(Object.isFrozen(a.snapshot.enemies[0])).toBe(true);
  });

  it("eases positions/yaw for rendering without altering authoritative tick state", () => {
    const world=new EnemyRoadWorld(1);
    step(world,300);
    const before=world.snapshot;
    world.step(FIXED_STEP_SECONDS);
    const after=world.snapshot;
    const half=world.sample(0.5);
    const first0=before.enemies[0]!;
    const first1=after.enemies[0]!;
    expect(half.enemies[0]!.distanceMeters).toBeCloseTo(
      (first0.distanceMeters+first1.distanceMeters)/2,9,
    );
    expect(world.sample(1).enemies[0]!.distanceMeters).toBe(first1.distanceMeters);
    expect(world.sample(0).enemies[0]!.distanceMeters).toBe(first0.distanceMeters);
    expect(world.snapshot).toBe(after);
    expect(before.tick).toBe(300);
    expect(after.tick).toBe(301);
    expect(() => world.sample(-0.01)).toThrow(RangeError);
    expect(() => world.step(NaN)).toThrow(RangeError);
    expect(() => world.step(1/30)).toThrow(RangeError);
    expect(world.snapshot).toBe(after);
  });

  it("stops at a staging point outside the keep without inflicting imaginary damage", () => {
    const world=new EnemyRoadWorld(2);
    step(world,1700);
    const runner=world.snapshot.enemies.find(e=>e.kind==="runner")!;
    expect(runner.phase).toBe("holding-at-gate");
    expect(runner.distanceMeters).toBeCloseTo(GATE_STAGING_DISTANCE_METERS,8);
    expect(GATE_STAGING_DISTANCE_METERS).toBeLessThan(ROAD_LENGTH_METERS);
    const atGate=locateRoadEnemy(GATE_STAGING_DISTANCE_METERS,runner.laneOffset,
      "fenwall-crossing-v1");
    expect(runner.x).toBeCloseTo(atGate.x,8);
    expect(runner.z).toBeCloseTo(atGate.z,8);
    expect(runner.hp).toBe(runner.maxHp);
    expect(world.snapshot.arrived).toBeGreaterThanOrEqual(1);
    // By 28 seconds the first two runners have reached separate gate slots.
    // Distinct slots matter visually: overlapping agents at the keep would
    // look like a single flickering model instead of a marching column.
    const holdingRunners=world.snapshot.enemies.filter(e=>
      e.kind==="runner"&&e.phase==="holding-at-gate");
    expect(holdingRunners.length).toBeGreaterThanOrEqual(2);
    for (let i=1;i<holdingRunners.length;i++) {
      const front=holdingRunners[i-1]!, rear=holdingRunners[i]!;
      expect(Math.hypot(front.x-rear.x,front.z-rear.z)).toBeGreaterThan(1.05);
    }
  });

  it("builds a reusable original, genuinely 3D runner silhouette and palette slots", () => {
    const mesh=createRunnerStudy();
    expect(() => validateGeometry(mesh)).not.toThrow();
    expect(mesh.bounds.max[1]).toBeGreaterThan(2);
    expect(mesh.bounds.min[1]).toBeGreaterThanOrEqual(0);
    expect(mesh.bounds.max[2]).toBeGreaterThan(1.5);
    expect(mesh.materialIds.some(slot=>slot>0)).toBe(true);
    expect(createRunnerStudy()).toBe(mesh);
  });
});
