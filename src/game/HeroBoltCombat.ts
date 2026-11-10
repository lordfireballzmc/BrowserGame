/**
 * F3.03 — physically traveling Warden bolts against the existing road world.
 * No DOM, visual-only hit checks, unseeded RNG, instant damage or free targets.
 * All authoritative updates happen at the same 60Hz tick as the enemy world.
 */
import { BALANCE } from "./Balance";
import {
  EnemyRoadWorld, GATE_STAGING_DISTANCE_METERS, locateRoadEnemy,
  type RoadEnemy,
} from "./EnemyRoadWorld";
import type { HeroSnapshot } from "./HeroMovement";
import { FIXED_STEP_SECONDS } from "../engine/Loop";

export interface HeroBolt {
  readonly id: number;
  readonly targetId: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly previousX: number;
  readonly previousY: number;
  readonly previousZ: number;
  readonly vx: number;
  readonly vy: number;
  readonly vz: number;
  readonly bornTick: number;
}
export interface BoltImpact {
  readonly boltId: number;
  readonly targetId: number;
  readonly tick: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly damage: number;
}
export interface HeroCombatSnapshot {
  readonly tick: number;
  readonly targetId: number | null;
  readonly aimYaw: number | null;
  readonly shotsFired: number;
  readonly hits: number;
  readonly damageDealt: number;
  readonly lastHitId: number | null;
  readonly bolts: readonly HeroBolt[];
  readonly impacts: readonly BoltImpact[];
}

const HERO = BALANCE.hero;
const FIRE_TICKS = Math.round(HERO.autoAttackIntervalSeconds / FIXED_STEP_SECONDS);
const MAX_BOLT_LIFE_TICKS = Math.ceil(1.25 / FIXED_STEP_SECONDS);
const MAX_SIMULTANEOUS_BOLTS = 16;
const CONTACT_RADIUS_METERS = 0.12 + 0.43;
const IMPACT_PERSIST_TICKS = 9;
const CORE_X = 31, CORE_Z = 2;

function squared(x: number, y: number, z: number): number { return x*x+y*y+z*z; }
function clampUnit(t: number): number { return Math.max(0,Math.min(1,t)); }
function freezeSnapshot(s: HeroCombatSnapshot): HeroCombatSnapshot {
  return Object.freeze({
    ...s,
    bolts: Object.freeze(s.bolts),
    impacts: Object.freeze(s.impacts),
  });
}

/**
 * Never target an actor outside 7m. Priority is enemies within 5m of core,
 * then nearest to the hero, then the lowest stable numeric entity ID.
 */
export function selectHeroTarget(
  hero: Pick<HeroSnapshot, "x" | "z">, enemies: readonly RoadEnemy[],
): RoadEnemy | null {
  const radiusSquared = HERO.autoAttackRangeMeters ** 2;
  let best: RoadEnemy | null = null;
  let bestPriority = Infinity;
  let bestDistance = Infinity;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const distance = squared(enemy.x - hero.x,0,enemy.z - hero.z);
    if (distance > radiusSquared + 1e-8) continue;
    const priority = squared(enemy.x-CORE_X,0,enemy.z-CORE_Z) <= 25 ? 0 : 1;
    if (priority < bestPriority
      || priority === bestPriority && (
        distance < bestDistance - 1e-8
        || Math.abs(distance-bestDistance) <= 1e-8 && enemy.id < (best?.id ?? Infinity)
      )) {
      best = enemy;
      bestPriority = priority;
      bestDistance = distance;
    }
  }
  return best;
}

/** Swept relative 3D segment: a fast bolt cannot tunnel through a moving target. */
export function boltSegmentHitsMovingEnemy(
  start: readonly [number,number,number],
  end: readonly [number,number,number],
  enemyFrom: readonly [number,number,number],
  enemyTo: readonly [number,number,number],
  radius = CONTACT_RADIUS_METERS,
): boolean {
  if (!(radius > 0) || !Number.isFinite(radius)) throw new RangeError("Invalid hit radius");
  const rx = start[0]-enemyFrom[0], ry = start[1]-enemyFrom[1], rz = start[2]-enemyFrom[2];
  const dx = end[0]-start[0]-(enemyTo[0]-enemyFrom[0]);
  const dy = end[1]-start[1]-(enemyTo[1]-enemyFrom[1]);
  const dz = end[2]-start[2]-(enemyTo[2]-enemyFrom[2]);
  const len2 = squared(dx,dy,dz);
  const t = len2 > 1e-12 ? clampUnit(-(rx*dx+ry*dy+rz*dz)/len2) : 0;
  return squared(rx+dx*t,ry+dy*t,rz+dz*t) <= radius*radius;
}

export class HeroBoltCombat {
  private current: HeroCombatSnapshot = freezeSnapshot({
    tick:0,targetId:null,aimYaw:null,shotsFired:0,hits:0,damageDealt:0,
    lastHitId:null,bolts:[],impacts:[],
  });
  private nextFireTick = 1;
  private nextBoltId = 1;

  get snapshot(): HeroCombatSnapshot { return this.current; }

  /**
   * Caller must step EnemyRoadWorld first, then invoke this once per hero tick.
   * No extra step during render/pause, so shots and hit timing remain replayable.
   */
  step(hero: HeroSnapshot, world: EnemyRoadWorld, dtSeconds: number): HeroCombatSnapshot {
    if (Math.abs(dtSeconds-FIXED_STEP_SECONDS)>1e-10 || !Number.isFinite(dtSeconds)
      || hero.tick !== this.current.tick+1) {
      throw new RangeError("Hero, enemy and bolt worlds must advance at one fixed 60Hz tick");
    }
    const tick=this.current.tick+1;
    const currentEnemies=world.snapshot.enemies;
    const previousEnemies=new Map(world.sample(0).enemies.map(e=>[e.id,e]));
    const nextBolts: HeroBolt[]=[];
    const impacts: BoltImpact[]=this.current.impacts.filter(i=>tick-i.tick<=IMPACT_PERSIST_TICKS);
    let hits=this.current.hits;
    let damageDealt=this.current.damageDealt;
    let lastHitId=this.current.lastHitId;

    for (const bolt of this.current.bolts) {
      if (tick-bolt.bornTick>MAX_BOLT_LIFE_TICKS) continue;
      const x=bolt.x+bolt.vx*dtSeconds;
      const y=bolt.y+bolt.vy*dtSeconds;
      const z=bolt.z+bolt.vz*dtSeconds;
      const target=currentEnemies.find(e=>e.id===bolt.targetId);
      const before=previousEnemies.get(bolt.targetId) ?? target;
      if (target && target.hp>0 && before &&
        boltSegmentHitsMovingEnemy(
          [bolt.x,bolt.y,bolt.z],[x,y,z],
          [before.x,before.y+1.10,before.z],
          [target.x,target.y+1.10,target.z],
        )) {
        const amount=world.applyBoltDamage(target.id,HERO.autoAttackDamage);
        if (amount>0) {
          hits++;damageDealt+=amount;lastHitId=target.id;
          impacts.push(Object.freeze({
            boltId:bolt.id,targetId:target.id,tick,
            x:target.x,y:target.y+1.10,z:target.z,damage:amount,
          }));
        }
        continue; // never make the same bolt hit twice
      }
      nextBolts.push(Object.freeze({
        ...bolt,previousX:bolt.x,previousY:bolt.y,previousZ:bolt.z,x,y,z,
      }));
    }

    const target=selectHeroTarget(hero,world.snapshot.enemies);
    let aimYaw: number | null=null;
    let shotsFired=this.current.shotsFired;
    if (target) {
      aimYaw=Math.atan2(-(target.x-hero.x),-(target.z-hero.z));
      if (tick>=this.nextFireTick && nextBolts.length<MAX_SIMULTANEOUS_BOLTS) {
        const barrelX=hero.x, barrelY=hero.groundY+1.23, barrelZ=hero.z;
        const straightDistance=Math.hypot(target.x-barrelX,target.z-barrelZ);
        // Arc-length lead is an aiming prediction, never hit registration.
        // One iteration accounts for the faster 3.4m/s Runner.
        const advance=target.phase==="advancing"
          ? Math.min(straightDistance/HERO.projectileSpeedMetersPerSecond,
            0.6)*target.speedMetersPerSecond : 0;
        const predict=locateRoadEnemy(
          Math.min(GATE_STAGING_DISTANCE_METERS-target.gateHoldBackMeters,
            target.distanceMeters+advance),target.laneOffset,world.seed);
        const dx=predict.x-barrelX,dy=predict.y+1.10-barrelY,dz=predict.z-barrelZ;
        const norm=Math.hypot(dx,dy,dz);
        if (norm>1e-5) {
          const speed=HERO.projectileSpeedMetersPerSecond/norm;
          nextBolts.push(Object.freeze({
            id:this.nextBoltId++, targetId:target.id,
            x:barrelX,y:barrelY,z:barrelZ,
            previousX:barrelX,previousY:barrelY,previousZ:barrelZ,
            vx:dx*speed,vy:dy*speed,vz:dz*speed,bornTick:tick,
          }));
          shotsFired++;
          this.nextFireTick=tick+FIRE_TICKS;
        }
      }
    }
    this.current=freezeSnapshot({
      tick,targetId:target?.id??null,aimYaw,
      shotsFired,hits,damageDealt,lastHitId,bolts:nextBolts,impacts,
    });
    return this.current;
  }

  /** Visual-only interpolation of in-flight bolts, never affects hit tests. */
  sample(alpha: number): HeroCombatSnapshot {
    if (!Number.isFinite(alpha) || alpha<0 || alpha>1) {
      throw new RangeError("Projectile interpolation alpha must be in [0,1]");
    }
    const bolts=this.current.bolts.map(bolt=>Object.freeze({
      ...bolt,
      x:bolt.previousX+(bolt.x-bolt.previousX)*alpha,
      y:bolt.previousY+(bolt.y-bolt.previousY)*alpha,
      z:bolt.previousZ+(bolt.z-bolt.previousZ)*alpha,
    }));
    return freezeSnapshot({...this.current,bolts,impacts:[...this.current.impacts]});
  }
}
