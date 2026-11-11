/**
 * F3.04a — REAL deterministic copper-crown pickups, Bolt Spire purchases,
 * and physically traveling tower bolts. Fixed-tick game state owns currency,
 * target selection, swept collisions and exactly-once death rewards.
 *
 * Scope: the currently playable authored wave-1/2 road encounter ONLY.
 * Full wave scheduling, counterattacks, tower upgrades and loss are not
 * implemented here; no pretend victory screen or instant free coins.
 */
import { BALANCE } from "./Balance";
import { seedToUint32 } from "./Random";
import {
  EnemyRoadWorld, GATE_STAGING_DISTANCE_METERS,locateRoadEnemy,
  type RoadEnemy,
} from "./EnemyRoadWorld";
import { boltSegmentHitsMovingEnemy } from "./HeroBoltCombat";
import type { HeroSnapshot } from "./HeroMovement";
import { PAD_SITES,isPadUnlocked,type PadId,type PadSite } from "../art/terrain/Pads";
import { terrainHeight } from "../art/terrain/Island";
import { FIXED_STEP_SECONDS } from "../engine/Loop";

export interface CrownPickup {
  readonly enemyId:number;
  readonly kind:RoadEnemy["kind"];
  readonly amount:number;
  readonly bornTick:number;
  readonly x:number;
  readonly y:number;
  readonly z:number;
}
export interface BuiltBoltSpire {
  readonly padId:PadId;
  readonly x:number;
  readonly y:number;
  readonly z:number;
  readonly paidCrowns:number;
  readonly builtTick:number;
  readonly shotsFired:number;
  readonly hits:number;
}
export interface TowerBolt {
  readonly id:number;
  readonly padId:PadId;
  readonly targetId:number;
  readonly bornTick:number;
  readonly x:number;
  readonly y:number;
  readonly z:number;
  readonly previousX:number;
  readonly previousY:number;
  readonly previousZ:number;
  readonly vx:number;
  readonly vy:number;
  readonly vz:number;
}
export interface TowerImpact {
  readonly id:number;
  readonly padId:PadId;
  readonly enemyId:number;
  readonly tick:number;
  readonly damage:number;
  readonly x:number;
  readonly y:number;
  readonly z:number;
}
export interface DefenseEconomySnapshot {
  readonly tick:number;
  readonly crowns:number;
  readonly collectedCrowns:number;
  readonly spentCrowns:number;
  readonly recoveryPotCrowns:number;
  readonly defeats:number;
  readonly lastDefeatedId:number|null;
  readonly lastPurchasePad:PadId|null;
  readonly totalDrops:number;
  readonly pendingPickups:readonly CrownPickup[];
  readonly towers:readonly BuiltBoltSpire[];
  readonly towerBolts:readonly TowerBolt[];
  readonly towerImpacts:readonly TowerImpact[];
  readonly towerShots:number;
  readonly towerHits:number;
}
export type BuildResult = Readonly<{
  ok:boolean;reason:"built"|"locked"|"insufficient"|"occupied"|"invalid";
  padId:PadId|null;crowns:number;
}>;

const TOWER=BALANCE.towers.boltSpire;
const TOWER_FIRE_TICKS=Math.round(TOWER.attackIntervalSeconds!/FIXED_STEP_SECONDS);
const PROJECTILE_SPEED=BALANCE.hero.projectileSpeedMetersPerSecond;
const COIN_MATURE_TICKS=Math.ceil(0.15/FIXED_STEP_SECONDS);
const COIN_EXPIRE_TICKS=Math.ceil(22/FIXED_STEP_SECONDS);
const BOLT_LIFE_TICKS=Math.ceil(1.5/FIXED_STEP_SECONDS);
const MAX_ACTIVE_TOWER_BOLTS=48;
const COIN_PICKUP_DISTANCE=1.7;
const IMPACT_LIFETIME=9;
const safeDistance=(x:number,z:number,u:number,v:number)=>Math.hypot(x-u,z-v);

function crownYield(seed:number,enemy:RoadEnemy):number {
  const config=BALANCE.enemies[enemy.kind];
  const range=config.crownDropMax-config.crownDropMin+1;
  let hash=seed^Math.imul(enemy.id,0x45d9f3b);
  hash=Math.imul(hash^(hash>>>16),0x7feb352d);
  hash=Math.imul(hash^(hash>>>15),0x846ca68b);
  return config.crownDropMin+((hash^(hash>>>16))>>>0)%range;
}
function targetFor(site:PadSite,enemies:readonly RoadEnemy[]):RoadEnemy|null {
  let result:RoadEnemy|null=null;
  for(const enemy of enemies){
    if(enemy.hp<=0||safeDistance(site.x,site.z,enemy.x,enemy.z)>
      TOWER.rangeMeters+1e-8)continue;
    if(!result || enemy.distanceMeters>result.distanceMeters+1e-8 ||
       (Math.abs(enemy.distanceMeters-result.distanceMeters)<=1e-8&&
        enemy.id<result.id))result=enemy;
  }
  return result;
}
function immutableSnapshot(s:DefenseEconomySnapshot):DefenseEconomySnapshot {
  return Object.freeze({...s,
    pendingPickups:Object.freeze([...s.pendingPickups]),
    towers:Object.freeze([...s.towers]),
    towerBolts:Object.freeze([...s.towerBolts]),
    towerImpacts:Object.freeze([...s.towerImpacts]),
  });
}

export class DefenseEconomyWorld {
  private state:DefenseEconomySnapshot=immutableSnapshot({
    tick:0,crowns:BALANCE.economy.startingCrowns,
    collectedCrowns:0,spentCrowns:0,recoveryPotCrowns:0,
    defeats:0,lastDefeatedId:null,lastPurchasePad:null,totalDrops:0,
    pendingPickups:[],towers:[],towerBolts:[],towerImpacts:[],
    towerShots:0,towerHits:0,
  });
  private readonly seed32:number;
  private readonly rewarded=new Set<number>();
  private readonly nextFire=new Map<PadId,number>();
  private nextBoltId=1;
  private lastRoadTick:number|null=null;

  constructor(private readonly seed:string|number="fenwall-crossing-v1"){
    this.seed32=seedToUint32(seed);
  }
  get snapshot():DefenseEconomySnapshot{return this.state;}

  /** Only the actual existing ten pad IDs, unlocked on the active wave.
   * Invalid/duplicate/unaffordable requests never spend a crown. */
  tryBuildBoltSpire(padId:string,wave=1):BuildResult {
    if(!Number.isInteger(wave)||wave<1||wave>10)
      throw new RangeError("Build request requires an authored wave 1 through 10");
    const site=PAD_SITES.find(p=>p.id===padId);
    const fail=(reason:BuildResult["reason"]):BuildResult=>
      Object.freeze({ok:false,reason,padId:site?.id??null,crowns:this.state.crowns});
    if(!site)return fail("invalid");
    if(!isPadUnlocked(site,wave))return fail("locked");
    if(this.state.towers.some(t=>t.padId===site.id))return fail("occupied");
    if(this.state.crowns<TOWER.costCrowns)return fail("insufficient");
    const built=Object.freeze({
      padId:site.id,x:site.x,y:terrainHeight(this.seed,site.x,site.z),
      z:site.z,paidCrowns:TOWER.costCrowns,builtTick:this.state.tick,
      shotsFired:0,hits:0,
    });
    this.nextFire.set(site.id,this.state.tick+1);
    this.state=immutableSnapshot({...this.state,
      crowns:this.state.crowns-TOWER.costCrowns,
      spentCrowns:this.state.spentCrowns+TOWER.costCrowns,
      lastPurchasePad:site.id,towers:[...this.state.towers,built],
    });
    return Object.freeze({ok:true,reason:"built",padId:site.id,crowns:this.state.crowns});
  }

  /** Call ONCE after the same authoritative player, raider and hero-combat
   * 60Hz tick. The raider clock may have a fixed *demo headstart*, but it must
   * advance exactly once on each subsequent economy step. */
  step(hero:Pick<HeroSnapshot,"tick"|"x"|"z">,road:EnemyRoadWorld,
    dtSeconds:number):DefenseEconomySnapshot {
    const tick=this.state.tick+1;
    if(!Number.isFinite(dtSeconds)||
       Math.abs(dtSeconds-FIXED_STEP_SECONDS)>1e-10||
       hero.tick!==tick||
       (this.lastRoadTick!==null&&road.snapshot.tick!==this.lastRoadTick+1))
      throw new RangeError("Defense economy must advance once per authoritative 60Hz tick");
    this.lastRoadTick=road.snapshot.tick;
    const prior=new Map(road.sample(0).enemies.map(e=>[e.id,e]));
    let hits=this.state.towerHits,shots=this.state.towerShots;
    const impacts:TowerImpact[]=this.state.towerImpacts.filter(i=>
      tick-i.tick<=IMPACT_LIFETIME);
    const flying:TowerBolt[]=[];
    const towerHits=new Map<PadId,number>();
    const towerShots=new Map<PadId,number>();

    // Advance physical bolts BEFORE firing new ones. The projectile must
    // travel across world coordinates; no damage on spawning a shot.
    for(const b of this.state.towerBolts){
      if(tick-b.bornTick>BOLT_LIFE_TICKS)continue;
      const x=b.x+b.vx*dtSeconds,y=b.y+b.vy*dtSeconds,
        z=b.z+b.vz*dtSeconds;
      const target=road.snapshot.enemies.find(e=>e.id===b.targetId);
      const before=prior.get(b.targetId)??target;
      if(target&&target.hp>0&&before&&
         boltSegmentHitsMovingEnemy(
           [b.x,b.y,b.z],[x,y,z],
           [before.x,before.y+1.1,before.z],
           [target.x,target.y+1.1,target.z],
         )){
        const actual=road.applyBoltDamage(target.id,TOWER.damagePerProjectile);
        if(actual>0){
          hits++;towerHits.set(b.padId,(towerHits.get(b.padId)??0)+1);
          impacts.push(Object.freeze({
            id:b.id,padId:b.padId,enemyId:target.id,tick,
            x:target.x,y:target.y+1.1,z:target.z,damage:actual,
          }));
        }
        continue;
      }
      flying.push(Object.freeze({...b,
        previousX:b.x,previousY:b.y,previousZ:b.z,x,y,z,
      }));
    }
    const sites=new Map(PAD_SITES.map(p=>[p.id,p]));
    for(const tower of this.state.towers){
      if(tick<(this.nextFire.get(tower.padId)??1)||
         flying.length>=MAX_ACTIVE_TOWER_BOLTS)continue;
      const site=sites.get(tower.padId)!;
      const target=targetFor(site,road.snapshot.enemies);
      if(!target)continue;
      const muzzleX=site.x,muzzleY=tower.y+3.65,muzzleZ=site.z;
      // Target lead is physics prediction only. Collision still uses swept
      // relative segments against the REAL moving authoritative enemy.
      const travel=safeDistance(muzzleX,muzzleZ,target.x,target.z)/PROJECTILE_SPEED;
      const ahead=target.phase==="advancing"
        ?Math.min(travel,0.65)*target.speedMetersPerSecond:0;
      const aim=locateRoadEnemy(Math.min(
        GATE_STAGING_DISTANCE_METERS-target.gateHoldBackMeters,
        target.distanceMeters+ahead),target.laneOffset,road.seed);
      const dx=aim.x-muzzleX,dy=aim.y+1.1-muzzleY,dz=aim.z-muzzleZ;
      const length=Math.hypot(dx,dy,dz);
      if(length<1e-5)continue;
      const factor=PROJECTILE_SPEED/length;
      flying.push(Object.freeze({
        id:this.nextBoltId++,padId:tower.padId,targetId:target.id,bornTick:tick,
        x:muzzleX,y:muzzleY,z:muzzleZ,
        previousX:muzzleX,previousY:muzzleY,previousZ:muzzleZ,
        vx:dx*factor,vy:dy*factor,vz:dz*factor,
      }));
      shots++;towerShots.set(tower.padId,(towerShots.get(tower.padId)??0)+1);
      this.nextFire.set(tower.padId,tick+TOWER_FIRE_TICKS);
    }
    const built=this.state.towers.map(t=>Object.freeze({...t,
      shotsFired:t.shotsFired+(towerShots.get(t.padId)??0),
      hits:t.hits+(towerHits.get(t.padId)??0),
    }));

    // A death is a REAL HP transition caused by registered bolt collision.
    // Downed bodies remain visible; the ID set prevents duplicate payouts
    // across all future ticks and repeated interactions with the corpse.
    const drops=[...this.state.pendingPickups];
    let kills=this.state.defeats,lastKill=this.state.lastDefeatedId,
      totalDrops=this.state.totalDrops;
    for(const enemy of road.snapshot.enemies){
      if(enemy.hp!==0||enemy.hitTick===null||this.rewarded.has(enemy.id))
        continue;
      this.rewarded.add(enemy.id);
      const amount=crownYield(this.seed32,enemy);
      drops.push(Object.freeze({
        enemyId:enemy.id,kind:enemy.kind,amount,bornTick:tick,
        x:enemy.x,y:enemy.y,z:enemy.z,
      }));
      kills++;lastKill=enemy.id;totalDrops+=amount;
    }
    let earned=0,recovery=0;
    const remaining:CrownPickup[]=[];
    for(const drop of drops){
      const age=tick-drop.bornTick;
      // Drops are physical pickup locations, NOT automatic income. The
      // Warden must move within the source 1.7m magnet distance after 0.15s.
      if(age>=COIN_MATURE_TICKS&&
        safeDistance(hero.x,hero.z,drop.x,drop.z)<=COIN_PICKUP_DISTANCE){
        earned+=drop.amount;
      }else if(age>=COIN_EXPIRE_TICKS){
        recovery+=Math.floor(drop.amount*0.5);
      }else remaining.push(drop);
    }
    this.state=immutableSnapshot({
      tick,crowns:this.state.crowns+earned,
      collectedCrowns:this.state.collectedCrowns+earned,
      spentCrowns:this.state.spentCrowns,
      recoveryPotCrowns:this.state.recoveryPotCrowns+recovery,
      defeats:kills,lastDefeatedId:lastKill,totalDrops,
      pendingPickups:remaining,towers:built,towerBolts:flying,
      towerImpacts:impacts,towerShots:shots,towerHits:hits,
      lastPurchasePad:this.state.lastPurchasePad,
    });
    return this.state;
  }
  /** Only the GPU render sample may interpolate projectiles. */
  sample(alpha:number):DefenseEconomySnapshot {
    if(!Number.isFinite(alpha)||alpha<0||alpha>1)
      throw new RangeError("Tower projectile interpolation alpha must be in [0,1]");
    return immutableSnapshot({...this.state,towerBolts:this.state.towerBolts.map(b=>
      Object.freeze({...b,x:b.previousX+(b.x-b.previousX)*alpha,
        y:b.previousY+(b.y-b.previousY)*alpha,
        z:b.previousZ+(b.z-b.previousZ)*alpha}))});
  }
}
