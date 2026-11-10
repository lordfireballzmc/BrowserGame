/**
 * VQ.02d — REAL same-Three-scene GPU-instanced illustrated understory.
 *
 * Reuses the original single KayKit forest atlas for authored grass and two
 * shrubs; imports two tiny locally pinned Kenney CC0 wildflower GLBs with true
 * sculpted petals. Nothing is an emoji, camera billboard or separate canvas.
 * Every placement is seed-stable and validated by GroundcoverPlan.
 *
 * The previous 152 grass + 24 flower procedural visuals remain fully intact
 * until this optional layer has been decoded and committed atomically.
 */
import {
  Box3, Color, Group, InstancedMesh, Material, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Scene, Vector3,
} from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {
  GROUNDCOVER_FLOWERS,GROUNDCOVER_FOREST_NODES,
  groundcoverFlowerUrl,type GroundcoverAssetId,
} from "../../art/assets/GroundcoverManifest";
import {
  GROUNDCOVER_BUDGET,generateGroundcover,type GroundcoverPlacement,
} from "../../art/scenery/GroundcoverPlan";
import type {SceneryPlacement} from "../../art/scenery/Scenery";

export interface GroundcoverArtStats {
  readonly sourceModels:number;
  readonly sharedForestAtlasModels:number;
  readonly sourcedFlowerModels:number;
  readonly grassInstances:number;
  readonly shrubInstances:number;
  readonly flowerInstances:number;
  readonly totalInstances:number;
  readonly instancedMeshes:number;
  readonly estimatedSourceTriangles:number;
}
type Source= { readonly id:GroundcoverAssetId;readonly group:Group;readonly targetHeight:number; };

export class GroundcoverArtLayer {
  private readonly root=new Group();
  private readonly resources:Group[]=[];
  private readonly materials:Material[]=[];
  private statistics:GroundcoverArtStats|null=null;
  private destroyed=false;
  private loading=false;
  constructor(private readonly scene:Scene) {
    this.root.name="Fenwall-VQ02d-painted-understory";
    scene.add(this.root);
  }
  get ready():boolean{return this.statistics!==null;}
  get stats():GroundcoverArtStats|null{return this.statistics;}

  async load(forest:Group,original:readonly SceneryPlacement[],
    seed:string|number):Promise<GroundcoverArtStats> {
    if(this.destroyed||this.loading||this.ready)
      throw new Error("Groundcover art may initialize once");
    this.loading=true;
    try {
      const placements=generateGroundcover(seed,original);
      forest.updateMatrixWorld(true);
      const sources:Source[]=[];
      for(const spec of GROUNDCOVER_FOREST_NODES){
        const source=forest.getObjectByName(spec.sourceNode);
        if(!(source instanceof Mesh))
          throw new Error("Missing original KayKit forest grass/bush source "+spec.sourceNode);
        if(!(source.material instanceof MeshStandardMaterial)||!source.material.map)
          throw new Error("KayKit undergrowth lost its real shared atlas "+spec.sourceNode);
        const group=new Group();
        group.name="KayKit-source-"+spec.id;
        group.add(source.clone(true));
        sources.push({id:spec.id,group,targetHeight:spec.targetHeight});
      }
      // The tiny Nature Kit color-PBR flowers are genuine source geometry,
      // but have no texture image. Do NOT pretend these are atlas textured.
      const loader=new GLTFLoader();
      const flowers=await Promise.all(GROUNDCOVER_FLOWERS.map(async spec=>{
        const url=groundcoverFlowerUrl(spec.file);
        const response=await fetch(url,{cache:"force-cache"});
        if(!response.ok)throw new Error("CC0 flower HTTP "+response.status+": "+spec.id);
        const bytes=await response.arrayBuffer();
        if(bytes.byteLength!==spec.bytes||
           new DataView(bytes).getUint32(0,true)!==0x46546c67)
          throw new Error("Broken source-pinned Kenney CC0 wildflower "+spec.id);
        const gltf=await loader.parseAsync(bytes,url);
        if(this.destroyed)throw new Error("Disposed during groundcover source load");
        let count=0;
        gltf.scene.traverse(n=>{if(n instanceof Mesh)count++;});
        if(!count)throw new Error("Wildflower is not original 3D authored mesh "+spec.id);
        return {id:spec.id,group:gltf.scene,targetHeight:spec.targetHeight} satisfies Source;
      }));
      sources.push(...flowers);
      if(this.destroyed)throw new Error("Disposed during undergrowth assembly");
      let meshBatches=0,triangles=0,forestAtlases=0,flowerSources=0;
      const grass=placements.filter(p=>p.kind==="grass").length;
      const shrub=placements.filter(p=>p.kind==="shrub").length;
      const flower=placements.filter(p=>p.kind==="flower").length;
      const work=new Group();
      work.name="Fenwall-illustrated-meadow-road-verges";
      const up=new Vector3(0,1,0);
      for(const spec of sources) {
        const selected=placements.filter(p=>p.source===spec.id);
        if(!selected.length)throw new Error("Unused source model "+spec.id);
        spec.group.updateMatrixWorld(true);
        const bounds=new Box3().setFromObject(spec.group);
        const size=bounds.getSize(new Vector3());
        if(!(size.y>0.01)||!(size.x>0.01)||!(size.z>0.01))
          throw new Error("Source undergrowth has no visible dimensions "+spec.id);
        const isFlower=spec.id.startsWith("flower-");
        if(isFlower)flowerSources++;else forestAtlases++;
        let sourceMeshes=0;
        spec.group.traverse(child=>{
          if(!(child instanceof Mesh))return;
          sourceMeshes++;
          const originals=Array.isArray(child.material)
            ?child.material:[child.material];
          const adapted=originals.map(m=>{
            const copy=m.clone();
            if(copy instanceof MeshStandardMaterial){
              copy.roughness=0.94;
              copy.metalness=0;
              if(isFlower){
                // Nature Kit flowers use PBR solid colors. Recolor only the
                // cyan-green stalk, leaving lilac and gold petal hues intact.
                if(copy.name.toLowerCase()==="grass")copy.color.set("#63966f");
                else copy.color.multiply(new Color("#e1d4c1"));
              } else {
                copy.color.multiply(new Color(spec.id==="grass"?
                  "#99b599":"#8aa78d"));
              }
            }
            this.materials.push(copy);
            return copy;
          });
          const material=Array.isArray(child.material)?adapted:adapted[0]!;
          const batch=new InstancedMesh(child.geometry,material,selected.length);
          batch.name="Fenwall-groundcover-"+spec.id;
          batch.frustumCulled=false; // instances across entire island
          batch.receiveShadow=true;
          batch.castShadow=spec.id!=="grass"&&!isFlower; // reduce mobile cost
          for(let i=0;i<selected.length;i++){
            const p:GroundcoverPlacement=selected[i]!;
            const scale=(spec.targetHeight/size.y)*p.variation;
            const matrix=new Matrix4().compose(
              new Vector3(p.x,p.y-bounds.min.y*scale,p.z),
              new Quaternion().setFromAxisAngle(up,p.angle),
              new Vector3(scale,scale,scale),
            );
            batch.setMatrixAt(i,matrix.multiply(child.matrixWorld));
          }
          batch.instanceMatrix.needsUpdate=true;
          triangles+=child.geometry.index
            ?child.geometry.index.count/3*selected.length
            :child.geometry.attributes.position.count/3*selected.length;
          work.add(batch);
          meshBatches++;
        });
        if(sourceMeshes<1)throw new Error("No authored mesh for "+spec.id);
        this.resources.push(spec.group);
      }
      if(grass!==GROUNDCOVER_BUDGET.totalGrass||
         shrub!==GROUNDCOVER_BUDGET.shrubs||
         flower!==GROUNDCOVER_BUDGET.totalFlowers||
         placements.length!==GROUNDCOVER_BUDGET.total||
         forestAtlases!==3||flowerSources!==2||
         meshBatches<5||meshBatches>12||triangles>650000) {
        throw new Error("Groundcover source/batch/geometry budget violated");
      }
      this.root.add(work); // atomic scene activation on SUCCESS only
      this.statistics=Object.freeze({
        sourceModels:sources.length,sharedForestAtlasModels:forestAtlases,
        sourcedFlowerModels:flowerSources,grassInstances:grass,
        shrubInstances:shrub,flowerInstances:flower,
        totalInstances:placements.length,instancedMeshes:meshBatches,
        estimatedSourceTriangles:Math.round(triangles),
      });
      return this.statistics;
    } finally {
      this.loading=false;
    }
  }
  dispose():void {
    if(this.destroyed)return;
    this.destroyed=true;
    this.scene.remove(this.root);
    const geometries=new Set<Mesh["geometry"]>();
    const materials=new Set<Material>(this.materials);
    const textures=new Set<NonNullable<MeshStandardMaterial["map"]>>();
    const collect=(g:Group)=>{
      g.traverse(n=>{
        if(!(n instanceof Mesh))return;
        geometries.add(n.geometry);
        for(const mat of Array.isArray(n.material)?n.material:[n.material])
          materials.add(mat);
        if(n instanceof InstancedMesh)n.dispose();
      });
    };
    collect(this.root);
    for(const g of this.resources)collect(g);
    for(const mat of materials){
      if(mat instanceof MeshStandardMaterial){
        for(const map of [mat.map,mat.normalMap,mat.roughnessMap,
          mat.metalnessMap,mat.emissiveMap])if(map)textures.add(map);
      }
      mat.dispose();
    }
    for(const texture of textures)texture.dispose();
    for(const geo of geometries)geo.dispose();
    this.root.clear();
    this.resources.length=0;
    this.materials.length=0;
    this.statistics=null;
  }
}
