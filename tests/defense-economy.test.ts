import {describe,expect,it} from "vitest";
import {BALANCE} from "../src/game/Balance";
import {DefenseEconomyWorld} from "../src/game/DefenseEconomyWorld";
import {EnemyRoadWorld} from "../src/game/EnemyRoadWorld";
import {HeroMovementWorld} from "../src/game/HeroMovement";
import {FIXED_STEP_SECONDS as DT} from "../src/engine/Loop";

function step(economy:DefenseEconomyWorld,road:EnemyRoadWorld,
  hero:HeroMovementWorld,position?:{x:number;z:number}):void {
  const h=hero.step({right:0,forward:0},DT);
  road.step(DT);
  economy.step(position?{tick:h.tick,...position}:h,road,DT);
}
describe("F3.04a real deterministic copper crowns and buildable Bolt Spires",()=>{
  it("starts with exactly 25 crowns, buys P01 for 20 and rejects bypasses without mutation",()=>{
    const economy=new DefenseEconomyWorld();
    expect(economy.snapshot.crowns).toBe(BALANCE.economy.startingCrowns);
    expect(economy.snapshot.crowns).toBe(25);
    expect(economy.tryBuildBoltSpire("P99")).toMatchObject({ok:false,reason:"invalid",crowns:25});
    expect(economy.tryBuildBoltSpire("P09",1)).toMatchObject({ok:false,reason:"locked",crowns:25});
    const purchased=economy.tryBuildBoltSpire("P01",1);
    expect(purchased).toMatchObject({ok:true,reason:"built",crowns:5,padId:"P01"});
    expect(economy.snapshot.towers).toHaveLength(1);
    expect(economy.snapshot.towers[0]).toMatchObject({padId:"P01",paidCrowns:20,shotsFired:0});
    expect(economy.snapshot.spentCrowns).toBe(20);
    expect(economy.tryBuildBoltSpire("P01",1)).toMatchObject({ok:false,reason:"occupied",crowns:5});
    expect(economy.tryBuildBoltSpire("P02",1)).toMatchObject({ok:false,reason:"insufficient",crowns:5});
    expect(economy.tryBuildBoltSpire("P03",1)).toMatchObject({ok:false,reason:"locked",crowns:5});
    expect(()=>economy.tryBuildBoltSpire("P01",0)).toThrow(RangeError);
    expect(economy.snapshot.crowns).toBe(5);
    expect(Object.isFrozen(economy.snapshot)).toBe(true);
    expect(Object.isFrozen(economy.snapshot.towers)).toBe(true);
  });
  it("an actually purchased tower fires delayed moving-target bolts, damages and defeats wave raiders",()=>{
    const economy=new DefenseEconomyWorld(),road=new EnemyRoadWorld(1);
    const hero=new HeroMovementWorld();
    economy.tryBuildBoltSpire("P01");
    step(economy,road,hero);
    expect(road.snapshot.enemies[0]!.hp).toBe(30); // no instant damage
    expect(economy.snapshot.towerShots).toBe(1);
    expect(economy.snapshot.towerBolts).toHaveLength(1);
    const first=economy.snapshot.towerBolts[0]!;
    expect(first.padId).toBe("P01");
    expect(Math.hypot(first.vx,first.vy,first.vz)).toBeCloseTo(15,8);
    let hit=false,down=false;
    for(let i=0;i<720;i++){
      step(economy,road,hero);
      hit ||=economy.snapshot.towerHits>0;
      down ||=road.snapshot.enemies.some(e=>e.hp===0);
      if(down)break;
    }
    expect(hit).toBe(true);
    expect(down).toBe(true);
    expect(economy.snapshot.towerHits).toBeGreaterThanOrEqual(3);
    expect(economy.snapshot.defeats).toBeGreaterThan(0);
    expect(economy.snapshot.pendingPickups.length).toBeGreaterThan(0);
    expect(economy.snapshot.crowns).toBe(5); // drops are NOT auto-income
    expect(economy.snapshot.totalDrops).toBeGreaterThan(0);
    expect(economy.snapshot.towers[0]!.hits).toBe(economy.snapshot.towerHits);
    const frozen=economy.snapshot;
    expect(economy.sample(0.5).towerBolts.length).toBe(frozen.towerBolts.length);
    expect(economy.snapshot).toBe(frozen);
  });
  it("matures physical pickup, collects only within 1.7m, pays once, cannot farm dead corpse",()=>{
    const eco=new DefenseEconomyWorld("reward-seed"),road=new EnemyRoadWorld(1,"reward-seed");
    const hero=new HeroMovementWorld("reward-seed");
    const h=hero.step({right:0,forward:0},DT);
    road.step(DT);
    const enemy=road.snapshot.enemies[0]!;
    expect(road.applyBoltDamage(enemy.id,500)).toBe(30);
    eco.step(h,road,DT);
    expect(eco.snapshot.defeats).toBe(1);
    expect(eco.snapshot.totalDrops).toBeGreaterThanOrEqual(2);
    expect(eco.snapshot.totalDrops).toBeLessThanOrEqual(3);
    expect(eco.snapshot.crowns).toBe(25);
    expect(eco.snapshot.pendingPickups).toHaveLength(1);
    const pickup=eco.snapshot.pendingPickups[0]!;
    for(let i=0;i<8;i++)step(eco,road,hero,{x:pickup.x,z:pickup.z});
    expect(eco.snapshot.crowns).toBe(25); // 0.15 sec maturation
    expect(eco.snapshot.pendingPickups).toHaveLength(1);
    step(eco,road,hero,{x:pickup.x,z:pickup.z});
    expect(eco.snapshot.crowns).toBe(25+pickup.amount);
    expect(eco.snapshot.pendingPickups).toHaveLength(0);
    expect(eco.snapshot.collectedCrowns).toBe(pickup.amount);
    for(let i=0;i<50;i++)step(eco,road,hero,{x:pickup.x,z:pickup.z});
    expect(eco.snapshot.defeats).toBe(1);
    expect(eco.snapshot.totalDrops).toBe(pickup.amount);
    expect(eco.snapshot.crowns).toBe(25+pickup.amount);
    expect(road.applyBoltDamage(enemy.id,13)).toBe(0);
  });
  it("expires uncollected drops to explicit half-value recovery pot, not free spendable coins",()=>{
    const eco=new DefenseEconomyWorld("pot-seed"),road=new EnemyRoadWorld(1,"pot-seed");
    const hero=new HeroMovementWorld("pot-seed");
    const h=hero.step({right:0,forward:0},DT);
    road.step(DT);
    const id=road.snapshot.enemies[0]!.id;
    road.applyBoltDamage(id,30);
    eco.step(h,road,DT);
    const value=eco.snapshot.totalDrops;
    for(let i=0;i<1320;i++)step(eco,road,hero);
    expect(eco.snapshot.pendingPickups).toHaveLength(0);
    expect(eco.snapshot.crowns).toBe(25);
    expect(eco.snapshot.recoveryPotCrowns).toBe(Math.floor(value/2));
  });
  it("rejects extra or out-of-order simulation ticks",()=>{
    const eco=new DefenseEconomyWorld(),road=new EnemyRoadWorld(1),
      hero=new HeroMovementWorld();
    const h=hero.step({right:0,forward:0},DT);
    road.step(DT);
    expect(()=>eco.step(h,road,DT/2)).toThrow(RangeError);
    eco.step(h,road,DT);
    expect(()=>eco.step(h,road,DT)).toThrow(RangeError);
    const next=hero.step({right:0,forward:0},DT);
    expect(()=>eco.step(next,road,DT)).toThrow(RangeError);
    expect(()=>eco.sample(NaN)).toThrow(RangeError);
  });
  it("replays byte-identical seeded tower damage, item drops and ledger for matching actions",()=>{
    const run=()=>{
      const eco=new DefenseEconomyWorld("replay-stage"),road=new EnemyRoadWorld(1,"replay-stage");
      const hero=new HeroMovementWorld("replay-stage");
      expect(eco.tryBuildBoltSpire("P01").ok).toBe(true);
      for(let i=0;i<260;i++)step(eco,road,hero);
      return {state:eco.snapshot,enemies:road.snapshot.enemies.map(e=>({id:e.id,hp:e.hp,hitTick:e.hitTick}))};
    };
    expect(run()).toEqual(run());
  });
});
