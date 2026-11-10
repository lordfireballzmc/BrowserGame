/**
 * VQ.02: One coherent CC0-authored, texture-mapped castle family in the real
 * Three.js battlefield. The independently composed Fenwall keep + ten pads
 * retain all original collision, economy and pad-hit coordinates.
 *
 * This is a visible art replacement, NOT a second canvas or a renderer swap.
 * All artist geometry and texture atlases are bundled/pinned in Git.
 */
import { Box3, Group, Material, Mesh, MeshStandardMaterial, Scene, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  ENVIRONMENT_MODELS, environmentModelUrl, type EnvironmentModelId,
} from "../../art/assets/EnvironmentManifest";

export interface EnvironmentPlacement {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
export interface EnvironmentPadPlacement extends EnvironmentPlacement {
  readonly unlockWave: number;
}
export interface EnvironmentArtStatus {
  readonly sourceModels: number;
  readonly texturedModels: number;
  readonly keepModules: number;
  readonly padModules: number;
  readonly pads: number;
  readonly instances: number;
}

/** Ready is committed atomically: broken/missing artist files leave the old
 * procedural keep/pads visible and cannot corrupt the gameplay renderer. */
export class EnvironmentArtLayer {
  private readonly root = new Group();
  private readonly templates = new Map<EnvironmentModelId, Group>();
  private readonly extraMaterials: Material[] = [];
  private statusValue: EnvironmentArtStatus | null = null;
  private loading = false;
  private destroyed = false;

  constructor(private readonly scene: Scene) {
    this.root.name = "Fenwall-original-CC0-modular-architecture";
    scene.add(this.root);
  }

  get ready(): boolean { return this.statusValue !== null; }
  get status(): EnvironmentArtStatus | null { return this.statusValue; }

  async load(keep: EnvironmentPlacement,
    pads: readonly EnvironmentPadPlacement[]): Promise<EnvironmentArtStatus> {
    if (this.loading || this.ready || this.destroyed) {
      throw new Error("Environment art can only initialize once");
    }
    if (pads.length !== 10 || ![keep, ...pads].every(p =>
        [p.x,p.y,p.z].every(Number.isFinite))) {
      throw new RangeError("Expected grounded keep and exactly ten finite pad locations");
    }
    if (pads.some(p => ![1,2,4,7].includes(p.unlockWave))) {
      throw new RangeError("Invalid pad unlock schedule in 3D art placement");
    }
    this.loading = true;
    try {
      const loader = new GLTFLoader();
      let texturedModels=0;
      // All transfers are from source-pinned locally bundled files; no CDN.
      const entries = await Promise.all(ENVIRONMENT_MODELS.map(async asset => {
        const response=await fetch(environmentModelUrl(asset.file),{cache:"force-cache"});
        if(!response.ok)throw new Error("VQ.02 asset HTTP "+response.status+": "+asset.id);
        const raw=await response.arrayBuffer();
        if(raw.byteLength!==asset.bytes ||
           new DataView(raw).getUint32(0,true)!==0x46546c67) {
          throw new Error("Invalid or changed bundled CC0 GLB: "+asset.id);
        }
        const imported=await loader.parseAsync(raw,environmentModelUrl(""));
        if(this.destroyed)throw new Error("Disposed during environment load");
        let meshCount=0,textureCount=0;
        imported.scene.traverse(child=>{
          if(!(child instanceof Mesh))return;
          meshCount++;
          for(const mat of Array.isArray(child.material)
            ? child.material : [child.material]) {
            if((mat as MeshStandardMaterial).map) textureCount++;
          }
        });
        if(meshCount<1||textureCount<1 ||
           new Box3().setFromObject(imported.scene)
             .getSize(new Vector3()).lengthSq()<0.001) {
          throw new Error("Authored mesh/PBR atlas missing: "+asset.id);
        }
        texturedModels++;
        return [asset.id,imported.scene] as const;
      }));
      if(this.destroyed)throw new Error("Disposed during environment load");
      for(const [id,model] of entries)this.templates.set(id,model);

      const assembly=new Group();
      assembly.name="Fenwall-keep-and-ten-tower-foundations";
      let keepModules=0,padModules=0;
      const put=(id:EnvironmentModelId,parent:Group,
        x:number,y:number,z:number,sx:number,sy:number,sz:number,
        muted=false):void=>{
        const template=this.templates.get(id);
        if(!template)throw new Error("Missing environment source "+id);
        // Clones share geometry and embedded atlas; material clones for
        // unavailable pads do not mutate the globally shared source texture.
        const model=template.clone(true);
        model.name="Fenwall-"+id+(muted?"-locked":"");
        model.position.set(x,y,z);
        model.scale.set(sx,sy,sz);
        model.traverse(child=>{
          if(!(child instanceof Mesh))return;
          child.castShadow=true;
          child.receiveShadow=true;
          if(muted){
            const original=Array.isArray(child.material)
              ? child.material : [child.material];
            const cloned=original.map(m=>{
              const copy=m.clone();
              if(copy instanceof MeshStandardMaterial){
                copy.color.multiplyScalar(0.55);
                copy.roughness=0.94;
              }
              this.extraMaterials.push(copy);
              return copy;
            });
            child.material=Array.isArray(child.material)?cloned:cloned[0]!;
          }
        });
        parent.add(model);
      };

      // Original arrangement: central inhabited blue-roofed hall + two
      // readable multi-storey corner turrets. The source modules are genuine
      // authored 3D geometry with embedded painted-atlas details; positioning,
      // grouped silhouette and scale are an original Bastionfall composition.
      const keepRoot=new Group();
      keepRoot.name="Fenwall-frontier-keep";
      keepRoot.position.set(keep.x,keep.y,keep.z);
      put("keep-main",keepRoot,0,0.01,0,3.07,3.07,3.07);
      keepModules++;
      for(const side of [-1,1]){
        const px=side*2.54;
        for(let floor=0;floor<3;floor++){
          put("turret-body",keepRoot,px,0.08+floor*1.53,0.12,
            1.52,1.52,1.52);
          keepModules++;
        }
        put("turret-roof",keepRoot,px,4.67,0.12,1.60,1.60,1.60);
        keepModules++;
      }
      assembly.add(keepRoot);

      // One repeating artist-made foundation kit at the ten *unchanged*
      // authored gameplay pad sites. Inset azure cap and four curved copper
      // glyph fragments communicate where the bolt spires will be constructed.
      // Later-wave pads are intentionally subdued, not purchaseable early.
      for(const [i,site] of pads.entries()){
        const pad=new Group();
        pad.name="Fenwall-P"+String(i+1).padStart(2,"0");
        pad.position.set(site.x,site.y,site.z);
        const muted=site.unlockWave>1;
        put("pad-border",pad,0,-0.11,0,3.42,0.90,3.42,muted);
        // The artist-authored azure enamel is a raised inset, not a flat
        // surface accidentally buried inside the tan stone border. Keep it
        // within the 4×4 gameplay footprint and the gold corner brackets.
        put("pad-inlay",pad,0,0.015,0,2.94,0.38,2.94,muted);
        put("pad-glyph",pad,0,0.415,0,3.65,1,3.65,muted);
        padModules+=3;
        assembly.add(pad);
      }
      // One atomic swap: existing fallback meshes are suppressed by the
      // UnifiedThreeRenderer only AFTER this fully imported scene is ready.
      this.root.add(assembly);
      const status=Object.freeze({
        sourceModels:this.templates.size,texturedModels,
        keepModules,padModules,pads:pads.length,
        instances:keepModules+padModules,
      });
      this.statusValue=status;
      return status;
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
    const collect=(group:Group)=>{
      group.traverse(child=>{
        if(!(child instanceof Mesh))return;
        geometries.add(child.geometry);
        const ms=Array.isArray(child.material)?child.material:[child.material];
        for(const mat of ms)materials.add(mat);
      });
    };
    collect(this.root);
    for(const group of this.templates.values())collect(group);
    for(const mat of this.extraMaterials)materials.add(mat);
    for(const material of materials){
      if(material instanceof MeshStandardMaterial){
        for(const map of [material.map,material.normalMap,material.roughnessMap,
          material.metalnessMap,material.emissiveMap]){
          if(map)textures.add(map);
        }
      }
      material.dispose();
    }
    for(const tex of textures)tex.dispose();
    for(const g of geometries)g.dispose();
    this.templates.clear();
    this.root.clear();
    this.extraMaterials.length=0;
    this.statusValue=null;
  }
}
