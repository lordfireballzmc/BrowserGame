import { describe, expect, it } from "vitest";
import { BALANCE } from "../src/game/Balance";
import { HeroMovementWorld } from "../src/game/HeroMovement";
import { EnemyRoadWorld, type RoadEnemy } from "../src/game/EnemyRoadWorld";
import {
  HeroBoltCombat, selectHeroTarget, boltSegmentHitsMovingEnemy,
} from "../src/game/HeroBoltCombat";
import { FIXED_STEP_SECONDS } from "../src/engine/Loop";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { createHeroBoltMesh, createBoltImpactMesh } from "../src/art/models/HeroBoltVisuals";

const DT=FIXED_STEP_SECONDS;
function advanceEnemy(world: EnemyRoadWorld, ticks: number): void {
  for(let i=0;i<ticks;i++)world.step(DT);
}
function tick(
  hero: HeroMovementWorld, enemies: EnemyRoadWorld, combat: HeroBoltCombat,
): void {
  const pose=hero.step({right:0,forward:0},DT);
  enemies.step(DT);
  combat.step(pose,enemies,DT);
}
function setup() {
  const hero=new HeroMovementWorld();
  const enemies=new EnemyRoadWorld(2);
  const combat=new HeroBoltCombat();
  advanceEnemy(enemies,1800);
  return {hero,enemies,combat};
}

describe("F3.03 truthful 60Hz Warden auto-fire and projectiles", () => {
  it("selects within 7m, prioritises near-core, then distance, then stable ID", () => {
    const enemies=new EnemyRoadWorld(2);
    enemies.step(DT);
    const template=enemies.snapshot.enemies[0]!;
    const e=(id:number,x:number,z:number,hp=30):RoadEnemy =>
      ({...template,id,x,z,hp});
    const hero={x:26,z:0};
    expect(selectHeroTarget(hero,[e(9,25,0),e(8,29,0)])?.id).toBe(8);
    expect(selectHeroTarget(hero,[e(4,28,0),e(3,28,0)])?.id).toBe(3);
    expect(selectHeroTarget(hero,[e(4,28,0),e(2,28,0,0)])?.id).toBe(4);
    expect(selectHeroTarget(hero,[e(8,34,0)])).toBeNull();
    expect(selectHeroTarget(hero,[e(9,32,2)])?.id).toBe(9);
  });

  it("uses a relative swept segment for crossing moving targets, no tunneling", () => {
    const start:[number,number,number]=[-1,0,0];
    const end:[number,number,number]=[1,0,0];
    expect(boltSegmentHitsMovingEnemy(start,end,[0,-1,0],[0,1,0],0.12)).toBe(true);
    expect(boltSegmentHitsMovingEnemy(start,end,[0,-1,1],[0,1,1],0.12)).toBe(false);
    expect(()=>boltSegmentHitsMovingEnemy(start,end,[0,-1,0],[0,1,0],0)).toThrow(RangeError);
  });

  it("fires only after an in-range target, with a 33-tick cooldown and 15m/s bolt", () => {
    const {hero,enemies,combat}=setup();
    const first=combat.snapshot;
    expect(first.shotsFired).toBe(0);
    tick(hero,enemies,combat);
    const fired=combat.snapshot;
    expect(fired.tick).toBe(1);
    expect(fired.shotsFired).toBe(1);
    expect(fired.bolts).toHaveLength(1);
    const bolt=fired.bolts[0]!;
    expect(Math.hypot(bolt.vx,bolt.vy,bolt.vz)).toBeCloseTo(
      BALANCE.hero.projectileSpeedMetersPerSecond,9);
    expect(bolt.x).toBe(hero.snapshot.x);
    for(let i=1;i<33;i++) tick(hero,enemies,combat);
    expect(combat.snapshot.shotsFired).toBe(2);
    expect(combat.snapshot.tick).toBe(33);
    expect(combat.snapshot.bolts.every(b=>b.targetId>0)).toBe(true);
  });

  it("registers damage strictly after actual travel and persists across enemy movement", () => {
    const {hero,enemies,combat}=setup();
    tick(hero,enemies,combat);
    expect(combat.snapshot.hits).toBe(0);
    const launchTick=combat.snapshot.tick;
    let hitTick=0;
    for(let i=0;i<450;i++) {
      tick(hero,enemies,combat);
      if(combat.snapshot.hits) { hitTick=combat.snapshot.tick; break; }
    }
    expect(hitTick).toBeGreaterThan(launchTick+1);
    expect(combat.snapshot.damageDealt).toBeGreaterThan(0);
    expect(combat.snapshot.hits).toBe(1);
    const damaged=enemies.snapshot.enemies.filter(e=>e.hp<e.maxHp);
    expect(damaged).toHaveLength(1);
    const hp=damaged[0]!.hp;
    advanceEnemy(enemies,60);
    expect(enemies.snapshot.enemies.find(e=>e.id===damaged[0]!.id)!.hp).toBe(hp);
    expect(enemies.snapshot.pending).toBe(0);
  });

  it("never double-applies a projectile and downed enemies stop permanently", () => {
    const {hero,enemies,combat}=setup();
    for(let i=0;i<1000;i++)tick(hero,enemies,combat);
    expect(combat.snapshot.hits).toBeGreaterThan(2);
    expect(combat.snapshot.damageDealt).toBeGreaterThan(15);
    const dead=enemies.snapshot.enemies.filter(e=>e.hp===0);
    expect(dead.length).toBeGreaterThan(0);
    const previousPositions=dead.map(e=>({id:e.id,x:e.x,z:e.z}));
    for(let i=0;i<100;i++)tick(hero,enemies,combat);
    for(const old of previousPositions) {
      const enemy=enemies.snapshot.enemies.find(e=>e.id===old.id)!;
      expect(enemy.hp).toBe(0);
      expect(enemy.phase).toBe("downed");
      expect(enemy.x).toBe(old.x);
      expect(enemy.z).toBe(old.z);
      expect(enemies.applyBoltDamage(old.id,8)).toBe(0);
    }
    expect(combat.snapshot.damageDealt).toBeLessThanOrEqual(
      enemies.snapshot.enemies.reduce((sum,e)=>sum+e.maxHp,0));
  });

  it("rejects invalid damage, preserves tick, caps HP and never resurrects on next step", () => {
    const enemies=new EnemyRoadWorld(1);
    enemies.step(DT);
    const id=enemies.snapshot.enemies[0]!.id;
    expect(()=>enemies.applyBoltDamage(id,0)).toThrow(RangeError);
    expect(()=>enemies.applyBoltDamage(id,-1)).toThrow(RangeError);
    expect(()=>enemies.applyBoltDamage(0,8)).toThrow(RangeError);
    const tick=enemies.snapshot.tick;
    expect(enemies.applyBoltDamage(id,900)).toBe(30);
    expect(enemies.snapshot.tick).toBe(tick);
    expect(enemies.snapshot.enemies[0]!.hp).toBe(0);
    expect(enemies.applyBoltDamage(id,8)).toBe(0);
    enemies.step(DT);
    expect(enemies.snapshot.enemies[0]!.hp).toBe(0);
  });

  it("samples in-flight copper bolts smoothly without modifying authoritative world", () => {
    const {hero,enemies,combat}=setup();
    tick(hero,enemies,combat);
    tick(hero,enemies,combat);
    const state=combat.snapshot;
    const bolt=state.bolts[0]!;
    const half=combat.sample(0.5).bolts[0]!;
    expect(half.x).toBeCloseTo((bolt.previousX+bolt.x)/2,10);
    expect(half.y).toBeCloseTo((bolt.previousY+bolt.y)/2,10);
    expect(half.z).toBeCloseTo((bolt.previousZ+bolt.z)/2,10);
    expect(combat.snapshot).toBe(state);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.bolts)).toBe(true);
    expect(()=>combat.sample(-0.1)).toThrow(RangeError);
    expect(()=>combat.step(hero.snapshot,enemies,DT)).toThrow(RangeError);
  });

  it("validates two reusable authored physical meshes for the gameplay renderer", () => {
    const bolt=createHeroBoltMesh();
    const impact=createBoltImpactMesh();
    expect(()=>validateGeometry(bolt)).not.toThrow();
    expect(()=>validateGeometry(impact)).not.toThrow();
    expect(bolt.bounds.min[2]).toBeLessThan(-0.4);
    expect(bolt.bounds.max[2]).toBeGreaterThan(0.25);
    expect(impact.positions.length).toBeGreaterThan(100);
    expect(createHeroBoltMesh()).toBe(bolt);
    expect(createBoltImpactMesh()).toBe(impact);
  });
});
