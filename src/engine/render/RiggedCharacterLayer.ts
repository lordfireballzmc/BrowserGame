/**
 * ART.03a: real authored skeletal characters with deterministic *visual*
 * animation on top of the existing 60Hz Bastionfall simulation.
 *
 * Artist: Kay Lousberg / KayKit Adventurers CC0. Three original source meshes
 * with authentic skins/UV atlas, 5 in-place clips, mobile-pruned at build time.
 * This module never changes positions, HP, collision or projectile timing.
 */
import {
  AnimationAction, AnimationClip, AnimationMixer, Box3, Group,
  LoopOnce, Matrix4, Mesh, MeshStandardMaterial, Quaternion,
  Scene, SkinnedMesh, Texture, Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import type { RenderInstance } from "./InstancedRenderer";

export type Role = "warden" | "scrapper" | "runner";
export type Motion = "Idle" | "Walk" | "Run" | "Attack" | "Death";
export interface ActorMotion {
  readonly motion: Motion;
  /** Exact simulation-derived time; rendering never advances game state. */
  readonly timeSeconds: number;
}
export interface RiggedCharacterStats {
  readonly sources: number;
  readonly skinnedSourceMeshes: number;
  readonly sourceAnimations: number;
  readonly animatedActors: number;
  readonly activeSkinnedMeshes: number;
  readonly activeBoneCount: number;
  readonly activeWalkCycles: number;
}
const SOURCES: readonly {role:Role; url:string; height:number}[]=[
  {role:"warden",url:`${import.meta.env.BASE_URL}assets/characters/warden-kaykit.glb`,height:2.22},
  {role:"scrapper",url:`${import.meta.env.BASE_URL}assets/characters/scrapper-kaykit.glb`,height:1.93},
  {role:"runner",url:`${import.meta.env.BASE_URL}assets/characters/runner-kaykit.glb`,height:1.85},
];
const OLD_MESH_TO_ROLE: Readonly<Record<string,Role>>={
  "staged-warden":"warden",
  "staged-scrapper":"scrapper",
  "route-runner":"runner",
};
const MOTIONS:readonly Motion[]=["Idle","Walk","Run","Attack","Death"];
/**
 * ART.03b art direction: independently illustrated cloth, armor, skin,
 * helmets, capes, weapons, legs and shields on the SAME authored KayKit rig.
 *
 * All source meshes have meaningful node names, a single artist atlas, and
 * actual 41-bone skeletons. Recoloring at node/material scope is superior to
 * an indiscriminate full-character hue: see original model node table in
 * docs/28_ART03B_CHARACTER_IDENTITY_REVIEW.md.
 */
export type ActorPart =
  | "body" | "arm" | "leg" | "face"
  | "headgear" | "cape" | "weapon" | "shield";
type ColorTriplet = readonly [number,number,number];
type ActorColors = Readonly<Record<ActorPart,ColorTriplet>>;
/** Deliberate THREE linear-fragment palette; original texture supplies tone. */
export const ACTOR_PALETTES:Readonly<Record<Role,ActorColors>>={
  warden:{
    body:[0.08,0.36,0.88],arm:[0.56,0.32,0.07],
    leg:[0.045,0.19,0.48],face:[0.87,0.55,0.32],
    headgear:[0.10,0.37,0.77],cape:[0.035,0.19,0.62],
    weapon:[0.64,0.76,0.83],shield:[0.90,0.50,0.09],
  },
  scrapper:{
    body:[1.00,0.035,0.045],arm:[0.91,0.055,0.06],
    leg:[0.49,0.025,0.055],face:[0.89,0.47,0.27],
    headgear:[0.94,0.035,0.07],cape:[0.62,0.020,0.065],
    weapon:[0.72,0.44,0.20],shield:[0.59,0.20,0.12],
  },
  runner:{
    body:[0.98,0.045,0.13],arm:[0.81,0.075,0.12],
    leg:[0.42,0.025,0.085],face:[0.84,0.48,0.27],
    headgear:[0.84,0.025,0.125],cape:[0.55,0.025,0.10],
    weapon:[0.77,0.55,0.29],shield:[0.50,0.12,0.18],
  },
} as const;
const PIGMENT_WEIGHT:Readonly<Record<ActorPart,number>>={
  body:0.92,arm:0.82,leg:0.93,face:0.52,
  headgear:0.88,cape:0.96,weapon:0.61,shield:0.86,
};
const EQUIPMENT:Readonly<Record<Role,ReadonlySet<string>>>={
  warden:new Set(["1H_Sword","Badge_Shield"]),
  scrapper:new Set(["1H_Axe","Barbarian_Round_Shield"]),
  runner:new Set(["1H_Crossbow","Knife_Offhand"]),
};
/** All supplied optional equipment names are in the reviewed source GLBs. */
const OPTIONAL_EQUIPMENT=new Set([
  "1H_Sword_Offhand","Badge_Shield","Rectangle_Shield","Round_Shield",
  "Spike_Shield","1H_Sword","2H_Sword",
  "1H_Axe_Offhand","Barbarian_Round_Shield","1H_Axe","2H_Axe","Mug",
  "Knife_Offhand","1H_Crossbow","2H_Crossbow","Knife","Throwable",
]);
export function isSelectedEquipment(name:string,role:Role):boolean {
  return !OPTIONAL_EQUIPMENT.has(name)||EQUIPMENT[role].has(name);
}
export function classifyActorPart(name:string,role:Role):ActorPart {
  const label=name.toLowerCase();
  if(label.includes("cape"))return "cape";
  if(label.includes("shield"))return "shield";
  if(/sword|axe|knife|crossbow|throwable|mug/.test(label))return "weapon";
  if(/helmet|_hat/.test(label))return "headgear";
  if(label.includes("head"))return role==="runner"?"headgear":"face";
  if(label.includes("arm"))return "arm";
  if(label.includes("leg"))return "leg";
  return "body";
}
function vector(color:ColorTriplet):string {
  return `vec3(${color.map(n=>n.toFixed(4)).join(",")})`;
}
/**
 * Uses original atlas luminance AFTER texture mapping to retain authored
 * fold/value variation without inheriting the old brown/green faction hue.
 * Distinct submesh palettes recover gold helmet, dark navy cape, warm skin,
 * red jacket, wine hood and metal weapons in the actual articulated models.
 */
export function factionFragment(
  fragment:string,role:Role,part:ActorPart="body",
):string {
  const marker="#include <map_fragment>";
  if(!fragment.includes(marker))
    throw new Error("Three MeshStandard map shader changed");
  const color=vector(ACTOR_PALETTES[role][part]);
  const strength=PIGMENT_WEIGHT[part].toFixed(3);
  return fragment.replace(marker,`${marker}
    float sourceLuma=clamp(dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)),0.0,1.0);
    float paintLight=clamp(0.39+sourceLuma*1.48,0.28,1.36);
    vec3 factionPaint=${color}*paintLight;
    diffuseColor.rgb=mix(diffuseColor.rgb,factionPaint,${strength});
  `);
}
export function stylizeActorMaterial(
  material:MeshStandardMaterial,role:Role,part:ActorPart="body",
):MeshStandardMaterial {
  const styled=material.clone();
  // UV texture remains intact, original atlas light/value variation retained.
  styled.color.set(0xffffff);
  styled.roughness=part==="weapon"?0.58:part==="headgear"?0.75:0.88;
  styled.metalness=part==="weapon"?0.22:part==="headgear"?0.12:0.04;
  styled.onBeforeCompile=shader=>{
    shader.fragmentShader=factionFragment(shader.fragmentShader,role,part);
  };
  // Explicit program key: the shader differs by both role and material part.
  styled.customProgramCacheKey=()=>`bastionfall-faction-paint-v3-${role}-${part}`;
  styled.needsUpdate=true;
  return styled;
}
interface Source {
  readonly role: Role;
  readonly template: Group;
  readonly animations: Map<Motion, AnimationClip>;
  readonly height: number;
  readonly meshCount: number;
  readonly boneCount: number;
}
interface Actor {
  readonly role:Role;
  readonly group: Group;
  readonly mixer: AnimationMixer;
  readonly actions: Map<Motion, AnimationAction>;
  readonly skinnedMeshes: number;
  readonly bones: number;
  motion:Motion;
  previousMotion:Motion|null;
  transitionStartedSeconds:number;
}
function validTime(value:number):void {
  if(!Number.isFinite(value)||value<0)throw new RangeError("Animation time must be nonnegative and finite");
}
/** Native procedural-to-animated pose handoff; 140ms is visibly short at 30 FPS. */
export const ANIMATION_BLEND_SECONDS=0.14;
/** Pure smoothstep: predictable at fixed simulation clock, never Date.now(). */
export function animationBlend(elapsedSeconds:number):number {
  if(!Number.isFinite(elapsedSeconds))throw new RangeError("Invalid animation transition age");
  const t=Math.max(0,Math.min(1,elapsedSeconds/ANIMATION_BLEND_SECONDS));
  return t*t*(3-2*t);
}

/** The single existing Three scene owns and renders every cloned skeleton. */
export class RiggedCharacterLayer {
  private readonly sources=new Map<Role,Source>();
  private readonly actors=new Map<object,Actor>();
  private readonly motions=new WeakMap<object,ActorMotion>();
  private readonly currentMatrix=new Matrix4();
  private readonly position=new Vector3();
  private readonly rotation=new Quaternion();
  private readonly scale=new Vector3();
  private disposed=false;
  private loading:Promise<RiggedCharacterStats>|null=null;
  private last:RiggedCharacterStats|null=null;
  private globalTime=0;

  constructor(private readonly scene:Scene) {}

  get ready(): boolean { return !this.disposed && this.sources.size===SOURCES.length; }
  get stats(): RiggedCharacterStats|null { return this.last; }

  setTime(seconds:number):void { validTime(seconds); this.globalTime=seconds; }

  setMotion(model:ArrayLike<number>, motion:Motion,timeSeconds:number):void {
    if(!MOTIONS.includes(motion))throw new RangeError("Unknown authored animation "+motion);
    validTime(timeSeconds);
    if(typeof model!=="object" || model===null)throw new TypeError("Actor transform must be stable object");
    this.motions.set(model,{motion,timeSeconds});
  }

  async load():Promise<RiggedCharacterStats> {
    if(this.disposed)throw new Error("Rigged model layer disposed");
    if(this.loading)return this.loading;
    this.loading=this.loadAll().catch(error=>{
      this.sources.clear();
      this.loading=null;
      throw error;
    });
    return this.loading;
  }

  private async loadAll():Promise<RiggedCharacterStats> {
    const loader=new GLTFLoader();
    let meshCount=0, boneCount=0;
    for(const spec of SOURCES) {
      const response=await fetch(spec.url,{cache:"force-cache"});
      if(!response.ok)throw new Error("Missing locally pinned KayKit CC0 "+spec.role+": "+response.status);
      const bytes=await response.arrayBuffer();
      if(bytes.byteLength<15000 || bytes.byteLength>=1_650_000 ||
         new DataView(bytes).getUint32(0,true)!==0x46546c67)
        throw new Error("Invalid or oversized bundled skeletal GLB "+spec.role);
      const gltf=await loader.parseAsync(bytes,`${import.meta.env.BASE_URL}assets/characters/`);
      if(this.disposed)throw new Error("Rigged scene disposed during loading");
      const clips=new Map<Motion,AnimationClip>();
      for(const motion of MOTIONS){
        const found=gltf.animations.find(clip=>clip.name===motion);
        if(!found || found.duration<=0 || found.tracks.length<1)
          throw new Error(spec.role+" is missing authentic "+motion+" bone animation");
        clips.set(motion,found);
      }
      // Original assets have attractive sculpted silhouettes but neutral /
      // green faction colors. The original Bastionfall defense-vs-raider read
      // requires blue Warden and unmistakably crimson hostile silhouettes.
      // Clone source materials by reference before tinting; don't recolor the
      // shared texture files or mutate animation/skeleton content.
      const byMaterial=new Map<string,MeshStandardMaterial>();
      const offeredEquipment=new Set<string>();
      const visibleEquipment=new Set<string>();
      gltf.scene.traverse(node=>{
        if(!(node instanceof Mesh))return;
        if(OPTIONAL_EQUIPMENT.has(node.name)){
          offeredEquipment.add(node.name);
          node.visible=isSelectedEquipment(node.name,spec.role);
          if(node.visible)visibleEquipment.add(node.name);
        }
        const part=classifyActorPart(node.name,spec.role);
        const recolor=(m:import("three").Material)=>{
          if(!(m instanceof MeshStandardMaterial))return m;
          const key=m.uuid+"|"+spec.role+"|"+part;
          let adjusted=byMaterial.get(key);
          if(!adjusted){
            adjusted=stylizeActorMaterial(m,spec.role,part);
            byMaterial.set(key,adjusted);
          }
          return adjusted;
        };
        node.material=Array.isArray(node.material)
          ?node.material.map(recolor):recolor(node.material);
      });
      if(visibleEquipment.size!==EQUIPMENT[spec.role].size ||
         [...EQUIPMENT[spec.role]].some(name=>!offeredEquipment.has(name)))
        throw new Error(spec.role+" source glTF attachment nodes changed; refusing invisible/incorrect weapons");
      let skinned=0,bones=0,mapped=0;
      gltf.scene.traverse(node=>{
        if(node instanceof SkinnedMesh) {
          skinned++;
          bones=Math.max(bones,node.skeleton.bones.length);
          node.castShadow=true;
          node.receiveShadow=true;
        }
        if(node instanceof Mesh){
          const mats=Array.isArray(node.material)?node.material:[node.material];
          for(const material of mats)if("map" in material && material.map)mapped++;
        }
      });
      if(skinned<1 || bones<8 || mapped<1)
        throw new Error(spec.role+" is not a real rigged textured character");
      // Use the artist's skinned vertex positions, not a temporary box.
      const box=new Box3().setFromObject(gltf.scene);
      const originalHeight=box.getSize(new Vector3()).y;
      if(!(originalHeight>0.01)||!Number.isFinite(originalHeight))
        throw new Error(spec.role+" mesh has invalid physical height");
      const scale=spec.height/originalHeight;
      gltf.scene.scale.setScalar(scale);
      const after=new Box3().setFromObject(gltf.scene);
      const center=after.getCenter(new Vector3());
      gltf.scene.position.set(-center.x,-after.min.y,-center.z);
      this.sources.set(spec.role,{
        role:spec.role,template:gltf.scene,animations:clips,height:spec.height,
        meshCount:skinned,boneCount:bones,
      });
      meshCount+=skinned;boneCount+=bones;
    }
    this.last=Object.freeze({
      sources:SOURCES.length,skinnedSourceMeshes:meshCount,
      sourceAnimations:SOURCES.length*MOTIONS.length,
      animatedActors:0,activeSkinnedMeshes:0,activeBoneCount:0,
      activeWalkCycles:0,
    });
    return this.last;
  }

  private makeActor(role:Role):Actor {
    const source=this.sources.get(role)!;
    // Cloning glTF without SkeletonUtils causes cloned SkinnedMeshes to share
    // the source skeleton and freeze/stretch as actors move independently.
    const clone=cloneSkinned(source.template) as Group;
    const root=new Group();
    root.add(clone);
    root.name="bastionfall-rigged-"+role;
    this.scene.add(root);
    const mixer=new AnimationMixer(clone);
    const actions=new Map<Motion,AnimationAction>();
    for(const [name,clip] of source.animations){
      const action=mixer.clipAction(clip);
      if(name==="Death"){action.setLoop(LoopOnce,1);action.clampWhenFinished=true;}
      actions.set(name,action);
    }
    let renderedMeshes=0,bones=0;
    clone.traverse(n=>{
      if(n instanceof SkinnedMesh){
        n.castShadow=true;
        n.receiveShadow=true;
        renderedMeshes++;
        // Multiple clothing pieces bind to the same skeleton; do NOT
        // misreport all repeated joint bindings as unique bones.
        bones=Math.max(bones,n.skeleton.bones.length);
      }
    });
    return {
      role,group:root,mixer,actions,
      skinnedMeshes:renderedMeshes,bones,motion:"Idle",
      previousMotion:null,transitionStartedSeconds:0,
    };
  }

  /**
   * Synchronize visible rigged actors to the exact source matrices.
   * Returns legacy instancing entries to suppress *only after all 3 assets
   * have passed validation*. A failed import leaves all fallback actors.
   */
  sync(instances:readonly RenderInstance[]):ReadonlySet<number> {
    const replaced=new Set<number>();
    if(!this.ready)return replaced;
    const seen=new Set<object>();
    let walkCycles=0;
    let meshCount=0, boneCount=0;
    for(let i=0;i<instances.length;i++){
      const ins=instances[i]!;
      const role=OLD_MESH_TO_ROLE[ins.meshId];
      if(!role || (ins.opacity??1)===0)continue;
      const matrix=ins.model;
      if(typeof matrix!=="object" || !matrix)continue;
      seen.add(matrix);
      let actor=this.actors.get(matrix);
      if(!actor){
        actor=this.makeActor(role);
        this.actors.set(matrix,actor);
      }
      actor.group.visible=true;
      this.currentMatrix.fromArray(matrix);
      this.currentMatrix.decompose(this.position,this.rotation,this.scale);
      actor.group.position.copy(this.position);
      actor.group.quaternion.copy(this.rotation);
      actor.group.scale.copy(this.scale);
      const animation=this.motions.get(matrix);
      const motion=animation?.motion??"Idle";
      const time=animation?.timeSeconds??this.globalTime;
      const currentAction=actor.actions.get(motion)!;
      if(motion!==actor.motion){
        // Short crossfade between authored bone poses instead of abruptly
        // snapping 41 joints from run to idle/attack/death.
        if(actor.previousMotion!==null)
          actor.actions.get(actor.previousMotion)?.stop();
        actor.previousMotion=actor.motion;
        actor.transitionStartedSeconds=this.globalTime;
        actor.motion=motion;
        actor.actions.get(motion)!.reset().play();
      } else if(!currentAction.isRunning() && motion!=="Death"){
        currentAction.reset().play();
      }
      if(actor.previousMotion!==null){
        const oldAction=actor.actions.get(actor.previousMotion)!;
        if(!oldAction.isRunning())oldAction.reset().play();
        const t=animationBlend(this.globalTime-actor.transitionStartedSeconds);
        currentAction.setEffectiveWeight(t);
        oldAction.setEffectiveWeight(1-t);
        if(t>=1){
          oldAction.stop();
          currentAction.setEffectiveWeight(1);
          actor.previousMotion=null;
        }
      }else currentAction.setEffectiveWeight(1);
      // Exact sampled game world progress, not accumulating Date.now()/rAF:
      // a pause or render refresh never changes authoritative simulation.
      const duration=currentAction.getClip().duration;
      const authoredTime=motion==="Death"
        ? Math.min(time,duration-1e-4)
        : time + (i%7)*0.135;
      actor.mixer.setTime(authoredTime);
      if(motion==="Walk" || motion==="Run")walkCycles++;
      meshCount+=actor.skinnedMeshes;
      boneCount+=actor.bones;
      replaced.add(i);
    }
    for(const [reference,actor] of this.actors)
      if(!seen.has(reference))actor.group.visible=false;
    this.last=Object.freeze({
      sources:3,
      skinnedSourceMeshes:[...this.sources.values()].reduce((a,s)=>a+s.meshCount,0),
      sourceAnimations:15,animatedActors:replaced.size,
      activeSkinnedMeshes:meshCount,activeBoneCount:boneCount,
      activeWalkCycles:walkCycles,
    });
    return replaced;
  }

  dispose():void {
    if(this.disposed)return;
    this.disposed=true;
    for(const actor of this.actors.values()){
      actor.mixer.stopAllAction();
      this.scene.remove(actor.group);
    }
    this.actors.clear();
    // Skinned clones intentionally share original buffer geometries, UV
    // atlases and textures. Dispose once, not for every instance.
    const geometries=new Set<import("three").BufferGeometry>();
    const materials=new Set<import("three").Material>();
    for(const source of this.sources.values()){
      source.template.traverse(node=>{
        if(!(node instanceof Mesh))return;
        geometries.add(node.geometry);
        for(const mat of Array.isArray(node.material)?node.material:[node.material])
          materials.add(mat);
      });
    }
    for(const g of geometries)g.dispose();
    for(const m of materials) {
      if("map" in m && m.map instanceof Texture)m.map.dispose();
      m.dispose();
    }
    this.sources.clear();
  }
}
