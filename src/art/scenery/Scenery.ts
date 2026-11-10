/**
 * F2.05 — deterministic, non-colliding decorative scenery placement.
 *
 * Seeded Poisson-like dart throwing with a spatial hash and bounded attempts,
 * stable stage-anchored biome constraints, and a three-seed CPU cache.
 *
 * Scenery has NO gameplay collision or navigation edges. The road, ten pads,
 * keep, enemy entrance, northern river (including banks), and island rim
 * have conservative class-specific exclusions. Seed varies visuals only.
 */
import { mat4 } from "gl-matrix";
import { SeededRandom, seedToUint32 } from "../../game/Random";
import { signedCoast, terrainHeight } from "../terrain/Island";
import { nearestRoadPoint, ROAD_SPEC } from "../terrain/RoadPath";
import { PAD_SITES } from "../terrain/Pads";
import { riverCenterZ, riverOuterBankWidth } from "../terrain/RiverPath";
import { getPropMesh, PROP_KINDS, type PropKind } from "./PropMeshes";
import type { RenderInstance } from "../../engine/render/InstancedRenderer";
import type { MaterialToken } from "../../engine/render/Palette";
import type { Geometry } from "../mesh/Primitives";

export interface SceneryPlacement {
  readonly id: string;
  readonly kind: PropKind;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  readonly scale: number;
  readonly rotation: number;
}
export interface SceneryBatch {
  readonly kind: PropKind;
  readonly meshId: string;
  readonly mesh: Geometry;
  readonly instances: readonly RenderInstance[];
  readonly count: number;
}
export interface SeededScenery {
  readonly seed: number;
  readonly placements: readonly SceneryPlacement[];
  readonly batches: readonly SceneryBatch[];
  readonly counts: Readonly<Record<PropKind,number>>;
  readonly rejectedCandidates: number;
}
export const SCENERY_SPEC: Readonly<Record<PropKind,{
  count:number; spacing:number; radius:number; roadGap:number;
  padGap:number; riverGap:number; entryGap:number; coreGap:number;
  seedSalt:number; material:MaterialToken;
}>>={
  pine:{count:24,spacing:3.4,radius:1.24,roadGap:3.5,
    padGap:2.5,riverGap:1.5,entryGap:4.2,coreGap:4,
    seedSalt:0x2106a22e,material:"grass.shadow"},
  broadleaf:{count:16,spacing:3.6,radius:1.32,roadGap:3.5,
    padGap:2.5,riverGap:1.5,entryGap:4.2,coreGap:4,
    seedSalt:0x174521af,material:"grass.primary"},
  rock:{count:42,spacing:2.5,radius:1.10,roadGap:1.9,
    padGap:1.5,riverGap:0.65,entryGap:3.6,coreGap:3.6,
    seedSalt:0x62b59427,material:"stone.base"},
  grass:{count:152,spacing:1.45,radius:0.22,roadGap:0.85,
    padGap:1.15,riverGap:0.45,entryGap:2.6,coreGap:2.6,
    seedSalt:0x19cc583b,material:"grass.shadow"},
  flower:{count:24,spacing:2.70,radius:0.14,roadGap:1.55,
    padGap:2.0,riverGap:0.8,entryGap:3.1,coreGap:3.1,
    seedSalt:0x5ba20b83,material:"ivory"},
};

const TWO_PI=Math.PI*2;
const MAX_ATTEMPTS_PER_ITEM=145;
const EPS=1e-6;

class Grid {
  private readonly bins=new Map<string,SceneryPlacement[]>();
  private readonly unit:number;
  private readonly extent:number;
  constructor(private readonly spacing:number){
    this.unit=spacing/Math.SQRT2;
    this.extent=Math.ceil(spacing/this.unit);
  }
  private location(x:number,z:number):[number,number]{
    return [Math.floor(x/this.unit),Math.floor(z/this.unit)];
  }
  clear(x:number,z:number):boolean{
    const [gx,gz]=this.location(x,z);
    for(let dx=-this.extent;dx<=this.extent;dx++)
      for(let dz=-this.extent;dz<=this.extent;dz++){
        const bin=this.bins.get((gx+dx)+":"+(gz+dz));
        if(!bin)continue;
        for(const p of bin)
          if((p.x-x)**2+(p.z-z)**2<(this.spacing-EPS)**2)return false;
      }
    return true;
  }
  add(p:SceneryPlacement):void{
    const [gx,gz]=this.location(p.x,p.z);
    const key=gx+":"+gz;
    const bin=this.bins.get(key);
    if(bin)bin.push(p);else this.bins.set(key,[p]);
  }
}

/** Reject any candidate whose actual visible footprint crosses a no-build zone. */
export function sceneryClearance(
  x:number,z:number,kind:PropKind,scale=1,
):boolean{
  if(!Number.isFinite(x)||!Number.isFinite(z)
    ||!Number.isFinite(scale)||scale<=0)throw new RangeError("Scenery location and scale must be finite positive");
  const cfg=SCENERY_SPEC[kind],radius=cfg.radius*scale;
  if(Math.abs(x)>=35.5||Math.abs(z)>=23.5)return false;
  // Coast curvature is noncircular; check all eight radial sample points.
  for(let i=0;i<8;i++){
    const a=i*TWO_PI/8;
    if(signedCoast(x+Math.cos(a)*(radius+0.2),z+Math.sin(a)*(radius+0.2))>=-0.002)
      return false;
  }
  const road=nearestRoadPoint(x,z).lateralDistance;
  if(road-ROAD_SPEC.halfWidthMeters-radius < cfg.roadGap)return false;
  for(const pad of PAD_SITES){
    const dx=Math.max(0,Math.abs(x-pad.x)-2);
    const dz=Math.max(0,Math.abs(z-pad.z)-2);
    if(Math.hypot(dx,dz) < cfg.padGap+radius)return false;
  }
  // Keep 7×7 foundation (+31,+2); apply extra clear distance to footprint.
  const cx=Math.max(0,Math.abs(x-31)-3.5);
  const cz=Math.max(0,Math.abs(z-2)-3.5);
  if(Math.hypot(cx,cz)<cfg.coreGap+radius)return false;
  if(Math.hypot(x+34,z+5)<cfg.entryGap+radius)return false;
  if(x>=-35 && x<=35 && Math.abs(z-riverCenterZ(x))
    -riverOuterBankWidth(x)<cfg.riverGap+radius)return false;
  return true;
}
function scaleRange(kind:PropKind,rng:SeededRandom):number{
  const lo=(kind==="pine"||kind==="broadleaf")?0.89:kind==="rock"?0.78:0.85;
  const hi=kind==="pine"||kind==="broadleaf"?1.02:kind==="rock"?1.16:1.20;
  return lo+(hi-lo)*rng.nextFloat();
}
function makeModel(p:SceneryPlacement):Float32Array{
  const transform=mat4.fromTranslation(mat4.create(),[p.x,p.y,p.z]);
  mat4.rotateY(transform,transform,p.rotation);
  mat4.scale(transform,transform,[p.scale,p.scale,p.scale]);
  return new Float32Array(transform);
}
const saved=new Map<number,SeededScenery>();

export function generateScenery(seed:string|number):SeededScenery{
  const key=seedToUint32(seed),previous=saved.get(key);
  if(previous)return previous;
  const placements:SceneryPlacement[]=[];
  const counts={} as Record<PropKind,number>;
  const batches:SceneryBatch[]=[];
  // Shared high-mass avoidance. Rocks and trees cannot overlap one another;
  // grass and flowers may occur under sparse canopy but not through rocks.
  const solid:SceneryPlacement[]=[];
  let rejectedCandidates=0;

  for(const kind of PROP_KINDS){
    const cfg=SCENERY_SPEC[kind];
    const rng=new SeededRandom(key^cfg.seedSalt);
    const grid=new Grid(cfg.spacing);
    const batch:SceneryPlacement[]=[];
    for(let attempt=0;attempt<cfg.count*MAX_ATTEMPTS_PER_ITEM
      &&batch.length<cfg.count;attempt++){
      const x=-35+70*rng.nextFloat();
      const z=-23+46*rng.nextFloat();
      const rotation=TWO_PI*rng.nextFloat();
      const scale=scaleRange(kind,rng);
      if(!sceneryClearance(x,z,kind,scale)||!grid.clear(x,z)){
        rejectedCandidates++;
        continue;
      }
      const radius=cfg.radius*scale;
      let blocked=false;
      for(const stone of solid){
        const gap=Math.hypot(x-stone.x,z-stone.z)-(stone.radius+radius);
        const required=kind==="pine"||kind==="broadleaf"||kind==="rock"
          ?0.28:kind==="flower"?0.12:0;
        if(gap<required){blocked=true;break;}
      }
      if(blocked){rejectedCandidates++;continue;}
      const place:SceneryPlacement=Object.freeze({
        id:kind+"-"+String(batch.length).padStart(3,"0"),
        kind,x:Math.fround(x),y:0,z:Math.fround(z),
        radius,scale,rotation,
      });
      // Anchor on true seed-dependent ground; the GPU never guesses the height.
      const actual:SceneryPlacement=Object.freeze({...place,
        y:terrainHeight(key,place.x,place.z)});
      batch.push(actual);
      grid.add(actual);
      placements.push(actual);
      if(kind==="pine"||kind==="broadleaf"||kind==="rock")solid.push(actual);
    }
    // Never silently render a sparse scene when a seed rejects too many sites.
    if(batch.length!==cfg.count)
      throw new Error("Poisson scenery budget could not be filled: "+kind+" "+batch.length+"/"+cfg.count);
    counts[kind]=batch.length;
    batches.push(Object.freeze({
      kind,meshId:"scenery-"+kind,mesh:getPropMesh(kind),
      instances:Object.freeze(batch.map(p=>Object.freeze({
        meshId:"scenery-"+kind,material:cfg.material,model:makeModel(p),
      }))),count:batch.length,
    }));
  }
  const result:SeededScenery=Object.freeze({
    seed:key,placements:Object.freeze(placements),
    batches:Object.freeze(batches),counts:Object.freeze(counts),
    rejectedCandidates,
  });
  if(saved.size>=3)saved.delete(saved.keys().next().value!);
  saved.set(key,result);
  return result;
}
