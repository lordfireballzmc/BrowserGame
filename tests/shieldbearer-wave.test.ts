import {describe,expect,it} from "vitest";
import {BALANCE} from "../src/game/Balance";
import {
  EnemyRoadWorld,MAX_SPAWNS_PER_SECOND,buildEarlySpawnQueue,
  resolveProjectileDamage,
} from "../src/game/EnemyRoadWorld";
import {FIXED_STEP_SECONDS} from "../src/engine/Loop";

describe("F3.04c1 real third-wave Shieldbearer assault",()=>{
  it("authors 18 Scrappers, 8 fast flankers and 3 genuinely armored shield enemies",()=>{
    const queue=buildEarlySpawnQueue(3);
    expect(queue).toHaveLength(29);
    expect(queue.filter(e=>e.kind==="scrapper")).toHaveLength(18);
    expect(queue.filter(e=>e.kind==="runner")).toHaveLength(8);
    expect(queue.filter(e=>e.kind==="shieldbearer")).toHaveLength(3);
    expect(queue[0]!.spawnTick).toBe(0);
    expect(queue[queue.length-1]!.spawnTick).toBeGreaterThan(1200);
    expect(queue[queue.length-1]!.spawnTick).toBeLessThanOrEqual(40*60);
    expect(queue.map(e=>e.id)).toEqual(Array.from({length:29},(_,i)=>i+1));
    for(let i=1;i<queue.length;i++){
      expect(queue[i]!.spawnTick).toBeGreaterThanOrEqual(queue[i-1]!.spawnTick);
    }
    for(const a of queue){
      expect(queue.filter(b=>
        b.spawnTick>=a.spawnTick && b.spawnTick<a.spawnTick+60,
      ).length).toBeLessThanOrEqual(MAX_SPAWNS_PER_SECOND);
    }
    expect(new EnemyRoadWorld(3,"fenwall").queue).toEqual(queue);
    expect(Object.isFrozen(queue)).toBe(true);
  });

  it("physically spawns and advances shield enemies on a distinct safe road lane",()=>{
    const road=new EnemyRoadWorld(3);
    for(let i=0;i<=365;i++)road.step(FIXED_STEP_SECONDS);
    const shields=road.snapshot.enemies.filter(e=>e.kind==="shieldbearer");
    expect(shields).toHaveLength(1);
    const shield=shields[0]!;
    expect(shield.hp).toBe(BALANCE.enemies.shieldbearer.health);
    expect(shield.maxHp).toBe(72);
    expect(shield.laneOffset).toBe(0.92);
    expect(shield.speedMetersPerSecond).toBe(1.25);
    expect(shield.phase).toBe("advancing");
    expect(shield.distanceMeters).toBeGreaterThan(0);
    expect(shield.distanceMeters).toBeLessThan(0.25);
  });

  it("blocks 45% only in the genuine 120-degree incoming front arc",()=>{
    const road=new EnemyRoadWorld(3);
    for(let i=0;i<365;i++)road.step(FIXED_STEP_SECONDS);
    const shield=road.snapshot.enemies.find(e=>e.kind==="shieldbearer")!;
    expect(shield).toBeDefined();
    const front={x:shield.x-2*Math.sin(shield.yaw),
      z:shield.z-2*Math.cos(shield.yaw)};
    const rear={x:shield.x+2*Math.sin(shield.yaw),
      z:shield.z+2*Math.cos(shield.yaw)};
    const side={x:shield.x+2*Math.cos(shield.yaw),
      z:shield.z-2*Math.sin(shield.yaw)};
    expect(resolveProjectileDamage(shield,20,front)).toBe(11);
    expect(resolveProjectileDamage(shield,20,rear)).toBe(20);
    expect(resolveProjectileDamage(shield,20,side)).toBe(20);
    expect(resolveProjectileDamage(shield,8,front)).toBe(4);
    expect(resolveProjectileDamage(shield,13,front)).toBe(7);
    expect(road.applyBoltDamage(shield.id,20,front)).toBe(11);
    expect(road.applyBoltDamage(shield.id,20,rear)).toBe(20);
    expect(road.applyBoltDamage(shield.id,20,side)).toBe(20);
    expect(road.snapshot.enemies.find(e=>e.id===shield.id)?.hp).toBe(21);
    expect(road.snapshot.enemies.find(e=>e.id===shield.id)?.hitTick)
      .toBe(road.snapshot.tick);
  });

  it("never reduces Scrappers, Runners or unattributed script damage",()=>{
    const road=new EnemyRoadWorld(3);
    for(let i=0;i<2;i++)road.step(FIXED_STEP_SECONDS);
    const scrapper=road.snapshot.enemies.find(e=>e.kind==="scrapper")!;
    expect(resolveProjectileDamage(scrapper,13,
      {x:scrapper.x+1,z:scrapper.z})).toBe(13);
    expect(road.applyBoltDamage(scrapper.id,13,
      {x:scrapper.x+1,z:scrapper.z})).toBe(13);
    const shield={...scrapper,kind:"shieldbearer" as const};
    expect(resolveProjectileDamage(shield,13)).toBe(13);
    expect(resolveProjectileDamage(shield,13,{x:shield.x,z:shield.z})).toBe(13);
    expect(()=>resolveProjectileDamage(shield,0)).toThrow(RangeError);
    expect(()=>resolveProjectileDamage(shield,13,{x:NaN,z:0})).toThrow(RangeError);
  });
});
