import {describe,expect,it} from "vitest";
import {BALANCE} from "../src/game/Balance";
import {EarlyWaveDirector,EARLY_WAVE_RULES} from "../src/game/EarlyWaveDirector";
import {HeroMovementWorld} from "../src/game/HeroMovement";
import {HeroBoltCombat} from "../src/game/HeroBoltCombat";
import {DefenseEconomyWorld} from "../src/game/DefenseEconomyWorld";
import {EnemyRoadWorld} from "../src/game/EnemyRoadWorld";
import {FIXED_STEP_SECONDS as DT} from "../src/engine/Loop";

function harness(preparationTicks=3,recoveryTicks=3){
  const director=new EarlyWaveDirector("fenwall-crossing-v1",
    {preparationTicks,recoveryTicks});
  const hero=new HeroMovementWorld();
  const combat=new HeroBoltCombat();
  const economy=new DefenseEconomyWorld();
  const tick=()=>{
    if(director.isTerminal)return director.snapshot;
    const pose=hero.step({right:0,forward:0},DT);
    return director.step(pose,hero,combat,economy,DT);
  };
  return {director,hero,combat,economy,tick};
}
describe("F3.04b authoritative early wave lifecycle and core defense",()=>{
  it("holds actual enemy spawns for preparation, then releases authored spawn offsets exactly",()=>{
    const {director,tick}=harness(12,4);
    expect(director.snapshot.phase).toBe("preparation");
    expect(director.snapshot.coreHp).toBe(BALANCE.core.health);
    expect(director.road.snapshot.enemies).toHaveLength(0);
    for(let i=0;i<11;i++)tick();
    expect(director.road.snapshot.spawned).toBe(0);
    expect(director.snapshot.phaseRemainingTicks).toBe(1);
    tick();expect(director.snapshot.phase).toBe("active");
    expect(director.road.snapshot.spawned).toBe(0);
    tick();expect(director.road.snapshot.spawned).toBe(1);
    expect(director.road.snapshot.enemies[0]?.spawnTick).toBe(0);
    for(let i=0;i<119;i++)tick();
    expect(director.road.snapshot.spawned).toBe(2);
    expect(director.snapshot.wave).toBe(1);
    expect(EARLY_WAVE_RULES.authoredWaves).toBe(2);
  });
  it("downed enemies never damage gates; living physically arrived raiders CAN damage real core to defeat",()=>{
    const {director,tick}=harness(1,5);
    tick();
    expect(director.snapshot.phase).toBe("active");
    let reached=false;
    for(let i=0;i<7500 && !director.isTerminal;i++){
      tick();
      if(director.snapshot.coreStrikes>0){reached=true;break;}
    }
    expect(reached).toBe(true);
    expect(director.snapshot.coreHp).toBeLessThan(300);
    expect(director.snapshot.lastDamageTarget).toBe("core");
    for(let i=0;i<5000 && !director.isTerminal;i++)tick();
    expect(director.snapshot.phase).toBe("lost");
    expect(director.snapshot.coreHp).toBe(0);
    expect(director.snapshot.wavesCleared).toBe(0);
    const lost=director.snapshot;
    expect(tick()).toBe(lost);
    expect(Object.isFrozen(lost)).toBe(true);
  });
  it("two real authored queues clear, pay exactly once, reset numbered enemy IDs, and finish in WON",()=>{
    const {director,economy,combat,tick}=harness(2,3);
    expect(economy.tryBuildBoltSpire("P01",1).ok).toBe(true);
    let oldRoad=director.road,changed=false;
    for(let i=0;i<4500 && !director.isTerminal;i++){
      tick();
      // Unit test injects legitimate health damage into existing spawned
      // entities to exhaust the queue rapidly; the REAL physically traveling
      // spire and hit registration are separately covered in F3.04a tests.
      for(const e of director.road.snapshot.enemies)
        if(e.hp>0)director.road.applyBoltDamage(e.id,999);
      if(oldRoad!==director.road){
        changed=true;oldRoad=director.road;
        expect(director.snapshot.wave).toBe(2);
        expect(director.snapshot.phase).toBe("preparation");
        expect(economy.snapshot.crowns).toBeGreaterThan(5);
        expect(economy.snapshot.towers.map(t=>t.padId)).toEqual(["P01"]);
        expect(combat.snapshot.bolts).toHaveLength(0);
      }
    }
    expect(changed).toBe(true);
    expect(director.snapshot.phase).toBe("won");
    expect(director.snapshot.wavesCleared).toBe(2);
    expect(director.snapshot.totalWaveRewards).toBe(20);
    expect(director.snapshot.coreHp).toBeGreaterThan(0);
    expect(economy.snapshot.defeats).toBe(29);
    expect(director.snapshot.enemiesRemaining).toBe(0);
    expect(director.snapshot.coreStrikes).toBe(0);
  });
  it("real wave rewards settle uncollected pickups at 50% and preserve persistent bought spires",()=>{
    const {director,economy,tick}=harness(1,2);
    expect(economy.tryBuildBoltSpire("P01").ok).toBe(true);
    let cleared=false;
    for(let i=0;i<2300;i++){
      tick();
      for(const e of director.road.snapshot.enemies)
        if(e.hp>0)director.road.applyBoltDamage(e.id,100);
      if(director.snapshot.wavesCleared===1&&director.snapshot.wave===2){
        cleared=true;break;
      }
    }
    expect(cleared).toBe(true);
    expect(director.snapshot.totalWaveRewards).toBe(10);
    expect(director.snapshot.recoveredCrowns).toBeGreaterThan(0);
    expect(economy.snapshot.pendingPickups).toHaveLength(0);
    expect(economy.snapshot.recoveryPotCrowns).toBe(0);
    expect(economy.snapshot.towers[0]?.padId).toBe("P01");
    expect(economy.tryBuildBoltSpire("P03",1).reason).toBe("locked");
    expect(economy.tryBuildBoltSpire("P03",2).ok).toBe(true);
  });
  it("rejects wrong cadence and never silently advances a completed run",()=>{
    const h=harness();
    const pose=h.hero.step({right:0,forward:0},DT);
    expect(()=>h.director.step(pose,h.hero,h.combat,h.economy,DT/2))
      .toThrow(RangeError);
    expect(h.director.snapshot.tick).toBe(0);
    h.director.step(pose,h.hero,h.combat,h.economy,DT);
    expect(()=>h.director.step(pose,h.hero,h.combat,h.economy,DT))
      .toThrow(RangeError);
    expect(()=>new EarlyWaveDirector("seed",{preparationTicks:0}))
      .toThrow(RangeError);
  });
  it("is deterministic across identical seed/input and tower actions",()=>{
    const a=()=>{const h=harness(2,2);h.economy.tryBuildBoltSpire("P01");
      for(let i=0;i<680;i++)h.tick();
      return {state:h.director.snapshot,crowns:h.economy.snapshot.crowns,
        enemies:h.director.road.snapshot.enemies,
        shots:h.economy.snapshot.towerShots,bolts:h.combat.snapshot.bolts};
    };
    expect(a()).toEqual(a());
  });
  it("legacy enemy-world wave-2 queues still spawn without any preparation directive",()=>{
    const world=new EnemyRoadWorld(2);
    world.step(DT);
    expect(world.snapshot.spawned).toBe(1);
    for(let i=0;i<1800;i++)world.step(DT);
    expect(world.snapshot.spawned).toBe(19);
  });
});
