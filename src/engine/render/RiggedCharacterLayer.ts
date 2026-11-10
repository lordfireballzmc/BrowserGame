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
  {role:"warden",url:"/assets/characters/warden-kaykit.glb",height:2.22},
  {role:"scrapper",url:"/assets/characters/scrapper-kaykit.glb",height:1.93},
  {role:"runner",url:"/assets/characters/runner-kaykit.glb",height:1.85},
];
const OLD_MESH_TO_ROLE: Readonly<Record<string,Role>>={
  "staged-warden":"warden",
  "staged-scrapper":"scrapper",
  "route-runner":"runner",
};
const MOTIONS:readonly Motion[]=["Idle","Walk","Run","Attack","Death"];
/** Persistent faction read at 30px on 9:16 gameplay; not HDR advertising chrome. */
export const ACTOR_TINTS:Readonly<Record<Role,number>>={
  warden:0x4b90de, scrapper:0xe54949, runner:0xd32d50,
} as const;
/**
 * KayKit's painterly atlas contains very little red in some leather/green
 * texels. MeshStandardMaterial.color alone MULTIPLIES that atlas; a red tint
 * cannot turn a dark-green cloth into red because the source red channel is
 * almost zero. The user-visible screenshot proved that multiplicative tint
 * failed. Repaint diffuse hue from original per-fragment luminance instead.
 *
 * This keeps all authored UV geometry, texture value gradients, bone weights,
 * shadow reception and PBR roughness. It does not clone huge PNG textures or
 * add render passes and works identically for 20 independently moving rigs.
 */
export function factionFragment(fragment:string, role:Role):string {
  const marker="#include <map_fragment>";
  if(!fragment.includes(marker))throw new Error("Three MeshStandard map shader changed");
  const base=role==="warden"
    ? "vec3(0.13,0.43,0.88)"
    : role==="scrapper" ? "vec3(0.91,0.13,0.20)"
      : "vec3(0.86,0.07,0.23)";
  const gold=role==="warden"
    ? `
      // Use the bright metal parts of the original source atlas as a
      // contrasting warm accent; keep most Warden silhouette distinctly blue.
      float goldAccent=smoothstep(0.74,0.98,sourceLuma)*0.55;
      factionPaint=mix(factionPaint,vec3(1.0,0.71,0.20)*paintLight,goldAccent);
    ` : "";
  return fragment.replace(marker,`${marker}
    float sourceLuma=clamp(dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)),0.0,1.0);
    float paintLight=clamp(0.52+sourceLuma*1.28,0.25,1.28);
    vec3 factionPaint=${base}*paintLight;
    ${gold}
    // 91% faction hue: neutral/brown/green characters are never mistaken
    // for allies while the source atlas still supplies visible fold/edge detail.
    diffuseColor.rgb=mix(diffuseColor.rgb,factionPaint,0.91);
  `);
}
export function stylizeActorMaterial(material:MeshStandardMaterial,role:Role):MeshStandardMaterial {
  // All clones share ONE source texture; preserve original UVs and artists'
  // painting values, but restore the required blue-versus-crimson gameplay read.
  const styled=material.clone();
  styled.color.set(0xffffff);
  styled.roughness=0.89;
  styled.metalness=Math.min(0.14,styled.metalness);
  styled.onBeforeCompile=shader=>{
    shader.fragmentShader=factionFragment(shader.fragmentShader,role);
  };
  // Three caches shader programs by this key; separate faction hues must not
  // accidentally reuse one another's compiled fragment program.
  styled.customProgramCacheKey=()=>`bastionfall-faction-paint-v2-${role}`;
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
}
function validTime(value:number):void {
  if(!Number.isFinite(value)||value<0)throw new RangeError("Animation time must be nonnegative and finite");
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
      const gltf=await loader.parseAsync(bytes,"/assets/characters/");
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
      const byMaterial=new Map<MeshStandardMaterial,MeshStandardMaterial>();
      gltf.scene.traverse(node=>{
        if(!(node instanceof Mesh))return;
        const recolor=(m:import("three").Material)=>{
          if(!(m instanceof MeshStandardMaterial))return m;
          let adjusted=byMaterial.get(m);
          if(!adjusted) {
            adjusted=stylizeActorMaterial(m,spec.role);
            byMaterial.set(m,adjusted);
          }
          return adjusted;
        };
        node.material=Array.isArray(node.material)
          ?node.material.map(recolor):recolor(node.material);
      });
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
      if(motion!==actor.motion || !actor.actions.get(motion)!.isRunning()){
        actor.actions.get(actor.motion)?.stop();
        actor.motion=motion;
        actor.actions.get(motion)!.reset().play();
      }
      // Exact sampled game world progress, not accumulating Date.now()/rAF:
      // a pause or render refresh never changes authoritative simulation.
      const duration=actor.actions.get(motion)!.getClip().duration;
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
