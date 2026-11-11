/**
 * F3.04b — finite TWO-WAVE playable Fenwall defense skirmish. This is
 * authoritative 60Hz gameplay, not a HUD countdown or a visual-only proxy.
 * The full product's ten-wave alpha and Shieldbearer/Sapper/Banner boss design
 * are separate future work. Existing F3.02 explicit movement probes remain
 * untouched via the old EnemyRoadWorld default.
 */
import {BALANCE} from "./Balance";
import {EnemyRoadWorld,type EarlyWave} from "./EnemyRoadWorld";
import {HeroBoltCombat} from "./HeroBoltCombat";
import {DefenseEconomyWorld} from "./DefenseEconomyWorld";
import {HeroMovementWorld,type HeroSnapshot} from "./HeroMovement";
import {FIXED_STEP_SECONDS} from "../engine/Loop";

export type EarlyWavePhase="preparation"|"active"|"recovery"|"won"|"lost";
export interface EarlyWaveSnapshot {
  readonly tick:number;
  readonly wave:EarlyWave;
  readonly phase:EarlyWavePhase;
  readonly phaseTicks:number;
  readonly phaseRemainingTicks:number;
  readonly coreHp:number;
  readonly heroHp:number;
  readonly heroRespawnTicks:number;
  readonly coreStrikes:number;
  readonly heroStrikes:number;
  readonly heroDeaths:number;
  readonly wavesCleared:number;
  readonly totalWaveRewards:number;
  readonly recoveredCrowns:number;
  readonly enemiesRemaining:number;
  readonly lastDamageTarget:"core"|"hero"|null;
  readonly lastDamageTick:number|null;
}
export const EARLY_WAVE_RULES={
  authoredWaves:2,
  preparationTicks:12*60,
  recoveryTicks:12*60,
  strikeTicks:Math.round(0.6/FIXED_STEP_SECONDS),
  heroRespawnTicks:4*60,
  heroContactRadiusMeters:1.4,
  coreGateStrikeMarginMeters:2.5,
  heroDeathCorePenalty:20,
  completionBonusCrowns:BALANCE.economy.betweenWaveCrowns,
} as const;

function freeze(s:EarlyWaveSnapshot):EarlyWaveSnapshot {
  return Object.freeze({...s});
}
export class EarlyWaveDirector {
  private state:EarlyWaveSnapshot;
  private enemyWorld:EnemyRoadWorld;
  private readonly nextStrikeTick=new Map<number,number>();
  private readonly prepDuration:number;
  private readonly recoverDuration:number;
  constructor(readonly seed:string|number="fenwall-crossing-v1",
    durations:Readonly<{preparationTicks?:number;recoveryTicks?:number}>={}) {
    this.prepDuration=durations.preparationTicks??EARLY_WAVE_RULES.preparationTicks;
    this.recoverDuration=durations.recoveryTicks??EARLY_WAVE_RULES.recoveryTicks;
    if(!Number.isSafeInteger(this.prepDuration)||this.prepDuration<1||
       !Number.isSafeInteger(this.recoverDuration)||this.recoverDuration<1)
      throw new RangeError("Wave phase durations must be positive integer 60Hz ticks");
    this.enemyWorld=new EnemyRoadWorld(1,seed);
    this.enemyWorld.setWaveActive(false);
    this.state=freeze({
      tick:0,wave:1,phase:"preparation",phaseTicks:0,
      phaseRemainingTicks:this.prepDuration,
      coreHp:BALANCE.core.health,heroHp:BALANCE.hero.health,
      heroRespawnTicks:0,coreStrikes:0,heroStrikes:0,heroDeaths:0,
      wavesCleared:0,totalWaveRewards:0,recoveredCrowns:0,
      enemiesRemaining:this.enemyWorld.queue.length,
      lastDamageTarget:null,lastDamageTick:null,
    });
  }
  get snapshot():EarlyWaveSnapshot{return this.state;}
  get road():EnemyRoadWorld{return this.enemyWorld;}
  get isTerminal():boolean{return this.state.phase==="won"||this.state.phase==="lost";}

  /** The hero has ALREADY advanced by one real 60Hz tick. Steps real
   * enemies/hero bolts/tower bolts/physical coin pickups in that strict
   * order, then applies source-interval contact/gate strikes and phase rules. */
  step(hero:HeroSnapshot,player:HeroMovementWorld,
    combat:HeroBoltCombat,economy:DefenseEconomyWorld,
    dtSeconds:number):EarlyWaveSnapshot {
    if(this.isTerminal)return this.state;
    if(!Number.isFinite(dtSeconds)||
       Math.abs(dtSeconds-FIXED_STEP_SECONDS)>1e-10||
       hero.tick!==this.state.tick+1)
      throw new RangeError("Wave director expects one real 60Hz hero tick");
    const tick=hero.tick;
    this.enemyWorld.step(dtSeconds);
    combat.step(hero,this.enemyWorld,dtSeconds);
    economy.step(hero,this.enemyWorld,dtSeconds);
    let coreHp=this.state.coreHp,heroHp=this.state.heroHp;
    let respawn=this.state.heroRespawnTicks;
    let coreStrikes=this.state.coreStrikes,
      heroStrikes=this.state.heroStrikes,deaths=this.state.heroDeaths;
    let lastDamageTarget=this.state.lastDamageTarget;
    let lastDamageTick=this.state.lastDamageTick;
    let phase:EarlyWavePhase=this.state.phase;
    let phaseTicks=this.state.phaseTicks+1;
    let wave=this.state.wave;
    let wavesCleared=this.state.wavesCleared;
    let totalWaveRewards=this.state.totalWaveRewards;
    let recoveredCrowns=this.state.recoveredCrowns;

    if(respawn>0){
      respawn--;
      if(respawn===0 && coreHp>0){
        heroHp=50;
        player.respawnAtCore(); // no tick rewind or collision bypass
      }
    }
    if(phase==="active"){
      // Real physically located actors, not a synthetic siege timer. Only
      // living raiders can strike, with 0.6s per-entity cooldown. "Holding"
      // at the gate is outside the solid keep. Raiders in back queue slots
      // CANNOT strike the gate from many meters away.
      for(const enemy of this.enemyWorld.snapshot.enemies){
        if(enemy.hp<=0)continue;
        const heroContact=heroHp>0&&
          Math.hypot(hero.x-enemy.x,hero.z-enemy.z) <=
            EARLY_WAVE_RULES.heroContactRadiusMeters;
        const atGate=enemy.phase==="holding-at-gate"&&
          enemy.gateHoldBackMeters <=
            EARLY_WAVE_RULES.coreGateStrikeMarginMeters;
        if(!heroContact&&!atGate)continue;
        if(tick<(this.nextStrikeTick.get(enemy.id)??0))continue;
        this.nextStrikeTick.set(enemy.id,tick+EARLY_WAVE_RULES.strikeTicks);
        // Source interval .6s * damage/s, rounded once to integer HP.
        const damage=Math.max(1,Math.round(enemy.damagePerStrike));
        if(heroContact){
          heroHp=Math.max(0,heroHp-damage);
          heroStrikes++;lastDamageTarget="hero";lastDamageTick=tick;
          if(heroHp===0){
            deaths++;respawn=EARLY_WAVE_RULES.heroRespawnTicks;
            coreHp=Math.max(0,coreHp-EARLY_WAVE_RULES.heroDeathCorePenalty);
          }
        }else {
          coreHp=Math.max(0,coreHp-damage);
          coreStrikes++;lastDamageTarget="core";lastDamageTick=tick;
        }
        if(coreHp===0){phase="lost";break;}
      }
      if(phase!=="lost"&&this.enemyWorld.snapshot.pending===0&&
         this.enemyWorld.snapshot.enemies.length>0&&
         this.enemyWorld.snapshot.enemies.every(e=>e.hp<=0)){
        phase="recovery";phaseTicks=0;
        wavesCleared++;
      }
    }else if(phase==="preparation"&&phaseTicks>=this.prepDuration){
      phase="active";phaseTicks=0;
      this.enemyWorld.setWaveActive(true);
    }else if(phase==="recovery"&&phaseTicks>=this.recoverDuration){
      const paid=economy.settleCompletedWave();
      totalWaveRewards+=paid.bonus;
      recoveredCrowns+=paid.recovered;
      if(wave>=EARLY_WAVE_RULES.authoredWaves){
        phase="won";phaseTicks=0;
      }else {
        economy.prepareNextWave();
        combat.prepareNextWave();
        this.nextStrikeTick.clear();
        wave=(wave+1) as EarlyWave;
        this.enemyWorld=new EnemyRoadWorld(wave,this.seed);
        this.enemyWorld.setWaveActive(false);
        phase="preparation";phaseTicks=0;
      }
    }
    const time=phase==="preparation"?this.prepDuration:
      phase==="recovery"?this.recoverDuration:0;
    this.state=freeze({
      tick,wave,phase,phaseTicks,
      phaseRemainingTicks:Math.max(0,time-phaseTicks),
      coreHp,heroHp,heroRespawnTicks:respawn,
      coreStrikes,heroStrikes,heroDeaths:deaths,
      wavesCleared,totalWaveRewards,recoveredCrowns,
      enemiesRemaining:phase==="active"
        ?this.enemyWorld.snapshot.pending+
          this.enemyWorld.snapshot.enemies.filter(e=>e.hp>0).length
        :phase==="preparation"?this.enemyWorld.queue.length:0,
      lastDamageTarget,lastDamageTick,
    });
    return this.state;
  }
}
