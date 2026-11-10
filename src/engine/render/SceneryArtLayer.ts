/**
 * VQ.02b — source-pinned Kenney CC0 trees and rocks within the ONE shared
 * Three/WebGL2 scene. This is only a visual replacement: the deterministic
 * 258-prop scenery placement, road/pad/core collision and enemy logic stay
 * owned by the existing game systems.
 *
 * GPU instancing avoids one draw call per tree/rock. Artist-made geometry and
 * authored texture atlases are kept, with a mild coherent palette pass for
 * the otherwise bright cyan Nature Kit materials. The smaller grass/flowers
 * remain the existing cheap double-sided source and are not disguised as art.
 */
import {
  Box3, Color, Group, InstancedMesh, Material, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Scene, Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  SCENERY_ART_MODELS, sceneryArtUrl, type SceneryArtModel,
} from "../../art/assets/SceneryArtManifest";
import type { SceneryPlacement } from "../../art/scenery/Scenery";

export interface SceneryArtStats {
  readonly sourceModels:number;
  readonly importedAtlasModels:number;
  readonly treeInstances:number;
  readonly rockInstances:number;
  readonly artInstances:number;
  readonly instancedMeshes:number;
}

/** Maps the imported PBR-compatible plain colors into Fenwall's warmer greens,
 * maintaining original multiple named bark, leaves and moss materials. Atlas
 * models use original texture images rather than destructively painting them. */
export function sceneryMaterialColor(name:string):string|null {
  const n=name.toLowerCase();
  if(n.startsWith("leafsdark"))return "#4f815f";
  if(n.startsWith("leafs"))return "#77a76e";
  if(n.includes("woodbarkdark"))return "#795c48";
  if(n.includes("woodbark"))return "#94724c";
  if(n.includes("grass"))return "#7b9f68";
  if(n.includes("dirt"))return "#88816a";
  return null;
}

/** Stable variety schedule independent of browser frame, seed consumption or
 * new random calls. Preserve original generated prop coordinates and rotation. */
export function sceneryModelForPlacement(p:SceneryPlacement):SceneryArtModel {
  if(p.kind==="grass"||p.kind==="flower")
    throw new RangeError("Only art-directed high-mass scenery is replaced");
  const options=SCENERY_ART_MODELS.filter(s=>s.kind===p.kind);
  const numeric=Number(p.id.slice(p.id.lastIndexOf("-")+1));
  if(!Number.isInteger(numeric)||numeric<0)
    throw new RangeError("Scenery placement IDs must have numeric suffix");
  return options[numeric%options.length]!;
}

/** Game-safe screen-height scale; never exceed the real scenery footprint. */
export function sceneryArtScale(
  sourceBounds:readonly [number,number,number],
  radius:number,relativeScale:number,targetHeight:number,
):number {
  if(![...sourceBounds,radius,relativeScale,targetHeight].every(v=>
      Number.isFinite(v)&&v>0))throw new RangeError("Invalid scenery bounds");
  const [width,height,depth]=sourceBounds;
  const byHeight=targetHeight/height;
  const byFootprint=(2*radius*0.90)/Math.max(width,depth);
  return Math.min(byHeight,byFootprint)*relativeScale;
}

interface LoadedModel {
  readonly spec:SceneryArtModel;
  readonly scene:Group;
  readonly bounds:Box3;
}

export class SceneryArtLayer {
  private readonly root=new Group();
  private readonly resources:Group[]=[];
  private readonly extraMaterials:Material[]=[];
  private loaded:SceneryArtStats|null=null;
  private loading=false;
  private destroyed=false;

  constructor(private readonly scene:Scene) {
    this.root.name="Fenwall-instanced-CC0-scenery";
    scene.add(this.root);
  }
  get ready():boolean { return this.loaded!==null; }
  get stats():SceneryArtStats|null { return this.loaded; }

  async load(placements:readonly SceneryPlacement[]):Promise<SceneryArtStats> {
    if(this.loading||this.ready||this.destroyed)
      throw new Error("Scenery art loads only once");
    const counts={pine:0,broadleaf:0,rock:0,grass:0,flower:0};
    for(const p of placements) {
      if(!(p.kind in counts)||![p.x,p.y,p.z,p.radius,p.scale,p.rotation]
        .every(Number.isFinite)||p.radius<=0||p.scale<=0) {
        throw new RangeError("Invalid deterministic scenery art input");
      }
      counts[p.kind]++;
    }
    if(placements.length!==258||counts.pine!==24||counts.broadleaf!==16||
       counts.rock!==42||counts.grass!==152||counts.flower!==24) {
      throw new RangeError("Authoritative F2.05 scenery budget changed");
    }
    this.loading=true;
    try {
      const loader=new GLTFLoader();
      const models=await Promise.all(SCENERY_ART_MODELS.map(async spec=>{
        const response=await fetch(sceneryArtUrl(spec.file),{cache:"force-cache"});
        if(!response.ok)throw new Error("Scenery CC0 HTTP "+response.status+": "+spec.id);
        const raw=await response.arrayBuffer();
        if(raw.byteLength!==spec.bytes ||
           new DataView(raw).getUint32(0,true)!==0x46546c67) {
          throw new Error("Changed or broken locally bundled scenery GLB: "+spec.id);
        }
        const gltf=await loader.parseAsync(raw,sceneryArtUrl(""));
        if(this.destroyed)throw new Error("Scenery layer disposed while loading");
        let meshCount=0,atlasCount=0;
        gltf.scene.traverse(child=>{
          if(!(child instanceof Mesh))return;
          meshCount++;
          const materials=Array.isArray(child.material)?child.material:[child.material];
          if(materials.some(m=>(m as MeshStandardMaterial).map))atlasCount++;
        });
        if(meshCount<1||(spec.hasAtlas && atlasCount<1)||
           (!spec.hasAtlas && atlasCount>0)) {
          throw new Error("Source authored geometry / texture expectation failed: "+spec.id);
        }
        gltf.scene.updateMatrixWorld(true);
        const bounds=new Box3().setFromObject(gltf.scene);
        const dims=bounds.getSize(new Vector3());
        if(![dims.x,dims.y,dims.z].every(v=>Number.isFinite(v)&&v>0.01)) {
          throw new Error("Invalid source scenery mesh dimensions "+spec.id);
        }
        return {spec,scene:gltf.scene,bounds} satisfies LoadedModel;
      }));
      if(this.destroyed)throw new Error("Scenery layer disposed during assembly");
      const work=new Group();
      work.name="Fenwall-mass-scenery-art-vq02b";
      let batches=0,treeInstances=0,rockInstances=0,atlases=0;
      const up=new Vector3(0,1,0);
      for(const model of models) {
        const selected=placements.filter(p=>
          (p.kind==="pine"||p.kind==="broadleaf"||p.kind==="rock") &&
          sceneryModelForPlacement(p).id===model.spec.id);
        if(!selected.length)throw new Error("Unused 3D scenery source "+model.spec.id);
        atlases+=Number(model.spec.hasAtlas);
        if(model.spec.kind==="rock")rockInstances+=selected.length;
        else treeInstances+=selected.length;
        const dims=model.bounds.getSize(new Vector3());
        model.scene.updateMatrixWorld(true);
        model.scene.traverse(child=>{
          if(!(child instanceof Mesh))return;
          const original=Array.isArray(child.material)
            ? child.material : [child.material];
          const toned=original.map(m=>{
            const variant=m.clone();
            if(variant instanceof MeshStandardMaterial) {
              const desired=!variant.map?sceneryMaterialColor(variant.name):null;
              if(desired)variant.color.set(new Color(desired));
              variant.roughness=0.92;
              variant.metalness=0;
            }
            this.extraMaterials.push(variant);
            return variant;
          });
          const material=Array.isArray(child.material)?toned:toned[0]!;
          const mesh=new InstancedMesh(child.geometry,material,selected.length);
          mesh.name="Fenwall-instanced-"+model.spec.id;
          mesh.castShadow=model.spec.kind!=="rock"; // static rocks receive sun/contact
          mesh.receiveShadow=true;
          mesh.frustumCulled=false; // source bounds do not contain all instances
          for(let i=0;i<selected.length;i++){
            const p=selected[i]!;
            const k=sceneryArtScale([dims.x,dims.y,dims.z],p.radius,p.scale,
              model.spec.targetHeight);
            const placement=new Matrix4().compose(
              new Vector3(p.x,p.y-model.bounds.min.y*k,p.z),
              new Quaternion().setFromAxisAngle(up,p.rotation),
              new Vector3(k,k,k),
            );
            // The source GLB may contain a small -0.05m authored root offset.
            // Include that local node transform; do not float trees above land.
            mesh.setMatrixAt(i,placement.multiply(child.matrixWorld));
          }
          mesh.instanceMatrix.needsUpdate=true;
          work.add(mesh);
          batches++;
        });
        this.resources.push(model.scene);
      }
      if(batches===0||treeInstances!==40||rockInstances!==42||atlases!==2)
        throw new Error("Missing genuine instanced scenery art");
      this.root.add(work);
      this.loaded=Object.freeze({
        sourceModels:models.length,importedAtlasModels:atlases,
        treeInstances,rockInstances,artInstances:treeInstances+rockInstances,
        instancedMeshes:batches,
      });
      return this.loaded;
    } finally {
      this.loading=false;
    }
  }

  dispose():void {
    if(this.destroyed)return;
    this.destroyed=true;
    this.scene.remove(this.root);
    const geometries=new Set<Mesh["geometry"]>();
    const materials=new Set<Material>();
    const textures=new Set<NonNullable<MeshStandardMaterial["map"]>>();
    const collect=(root:Group)=>{
      root.traverse(node=>{
        if(!(node instanceof Mesh))return;
        geometries.add(node.geometry);
        const ms=Array.isArray(node.material)?node.material:[node.material];
        for(const mat of ms)materials.add(mat);
      });
    };
    collect(this.root);
    for(const root of this.resources)collect(root);
    for(const mat of this.extraMaterials)materials.add(mat);
    for(const mat of materials) {
      if(mat instanceof MeshStandardMaterial) {
        for(const tex of [mat.map,mat.normalMap,mat.emissiveMap,
          mat.metalnessMap,mat.roughnessMap])if(tex)textures.add(tex);
      }
      mat.dispose();
    }
    for(const t of textures)t.dispose();
    for(const g of geometries)g.dispose();
    this.root.clear();
    this.resources.length=0;
    this.extraMaterials.length=0;
    this.loaded=null;
  }
}
