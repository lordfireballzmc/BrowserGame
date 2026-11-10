/**
 * VQ.02d — deterministic decorative undergrowth. This is a VISUAL overlay
 * only: the F2.05 258 canonical scenery sites, collision, wave routes, tower
 * placement, terrain and seed remain completely unchanged.
 *
 * Small secondary clusters are seeded consistently; each is checked against
 * the ORIGINAL road, pad, keep, river and island-rim exclusion rules.
 */
import { SeededRandom, seedToUint32 } from "../../game/Random";
import { terrainHeight } from "../terrain/Island";
import { nearestRoadPoint } from "../terrain/RoadPath";
import { sceneryClearance, type SceneryPlacement } from "./Scenery";

export type GroundcoverKind = "grass" | "shrub" | "flower";
export interface GroundcoverPlacement {
  readonly kind:GroundcoverKind;
  readonly source:"grass"|"shrub-round"|"shrub-branch"|"flower-gold"|"flower-lilac";
  readonly x:number;
  readonly y:number;
  readonly z:number;
  readonly angle:number;
  /** Multiplicative source-height variation, NOT new gameplay collision. */
  readonly variation:number;
  readonly origin:"canonical"|"supplemental";
}
export const GROUNDCOVER_BUDGET = {
  canonicalGrassSites:152,
  canonicalFlowerSites:24,
  grassPerSite:3,
  supplementalGrass:280,
  shrubs:48,
  flowersPerSite:3,
  supplementalFlowers:48,
  totalGrass:736,
  totalFlowers:120,
  total:904,
} as const;

function nearRock(x:number,z:number,rocks:readonly SceneryPlacement[],buffer:number):boolean {
  return rocks.some(r=>Math.hypot(r.x-x,r.z-z)<r.radius+buffer);
}
const round=(n:number)=>Math.fround(n);
function place(kind:GroundcoverKind,source:GroundcoverPlacement["source"],
  x:number,z:number,angle:number,variation:number,
  origin:GroundcoverPlacement["origin"],seed:number):GroundcoverPlacement {
  return Object.freeze({kind,source,x:round(x),z:round(z),
    y:terrainHeight(seed,round(x),round(z)),
    angle,variation,origin});
}
function sourceFor(kind:GroundcoverKind,index:number):GroundcoverPlacement["source"] {
  return kind==="grass"?"grass":
    kind==="shrub"?(index%6===0?"shrub-round":"shrub-branch"):
    index%3===0?"flower-lilac":"flower-gold";
}

export function generateGroundcover(
  seed:string|number,placements:readonly SceneryPlacement[],
):readonly GroundcoverPlacement[] {
  const grass=placements.filter(p=>p.kind==="grass");
  const flowers=placements.filter(p=>p.kind==="flower");
  const rocks=placements.filter(p=>p.kind==="rock");
  if(placements.length!==258||
     placements.filter(p=>p.kind==="pine").length!==24||
     placements.filter(p=>p.kind==="broadleaf").length!==16||
     grass.length!==GROUNDCOVER_BUDGET.canonicalGrassSites ||
     flowers.length!==GROUNDCOVER_BUDGET.canonicalFlowerSites ||
     rocks.length!==42)
    throw new RangeError("F2.05 seed source is not the canonical 258-place world");
  const key=seedToUint32(seed);
  const rng=new SeededRandom(key^0x6ac8d209);
  const out:GroundcoverPlacement[]=[];
  // Three *authored 3D* painted tufts per original low-mass grass location,
  // tightly clustered so they remain in pre-cleared gameplay-safe areas.
  for(const p of grass)for(let i=0;i<GROUNDCOVER_BUDGET.grassPerSite;i++){
    const angle=p.rotation+i*Math.PI*2/3;
    const distance=i===0?0:0.13;
    let x=p.x+Math.cos(angle)*distance;
    let z=p.z+Math.sin(angle)*distance;
    // A few canonical tufts are right against the legal shoreline/road
    // clearance limit. Keep the ORIGINAL authorized point in that case:
    // decorative clumps can overlap each other but never force a new site.
    if(!sceneryClearance(x,z,"grass",1.4)){
      x=p.x;z=p.z;
      if(!sceneryClearance(x,z,"grass",p.scale))
        throw new RangeError("Original grass source failed its own clearance");
    }
    out.push(place("grass","grass",x,z,angle,
      0.82+0.31*rng.nextFloat(),"canonical",key));
  }
  // Likewise extend 24 original botanical focus points into visible grouped
  // wildflowers rather than a microscopic single camera-facing cross.
  for(const p of flowers)for(let i=0;i<GROUNDCOVER_BUDGET.flowersPerSite;i++){
    const angle=p.rotation+i*Math.PI*2/3;
    const distance=i===0?0:0.16;
    let x=p.x+Math.cos(angle)*distance;
    let z=p.z+Math.sin(angle)*distance;
    if(!sceneryClearance(x,z,"flower",1.65)){
      x=p.x;z=p.z;
      if(!sceneryClearance(x,z,"flower",p.scale))
        throw new RangeError("Original flower source failed its own clearance");
    }
    out.push(place("flower",sourceFor("flower",i),x,z,angle,
      0.82+0.24*rng.nextFloat(),"canonical",key));
  }
  // Additional scattered meadow patches are decorative only: no new
  // collision objects, no altered F2.05 scenery budgets or tower-pad centers.
  function scatter(kind:GroundcoverKind,count:number,
    nearRoad:boolean,offset:number):void {
    let created=0,attempts=0;
    const chosen:{x:number;z:number}[]=[];
    while(created<count && attempts++<count*240){
      const x=-34.3+68.6*rng.nextFloat();
      const z=-22.2+44.4*rng.nextFloat();
      const src=sourceFor(kind,created+offset);
      const scale=kind==="shrub"?2.65:kind==="flower"?1.7:1.4;
      if(!sceneryClearance(x,z,kind==="shrub"?"grass":kind,scale))
        continue;
      if(nearRock(x,z,rocks,kind==="shrub"?0.75:0.40))continue;
      const road=nearestRoadPoint(x,z).lateralDistance;
      if(nearRoad && (road<3.6 || road>7.9))continue;
      if(chosen.some(p=>Math.hypot(p.x-x,p.z-z)<(kind==="grass"?0.57:1.38)))
        continue;
      const angle=Math.PI*2*rng.nextFloat();
      chosen.push({x,z});
      out.push(place(kind,src,x,z,angle,
        0.87+0.28*rng.nextFloat(),"supplemental",key));
      created++;
    }
    if(created!==count)
      throw new Error("Cannot fill visual-only "+kind+" seed budget: "+created+"/"+count);
  }
  scatter("grass",GROUNDCOVER_BUDGET.supplementalGrass,false,0);
  // Side-of-lane groupings give organic green rhythm WITHOUT invading road.
  scatter("shrub",GROUNDCOVER_BUDGET.shrubs,true,0);
  scatter("flower",GROUNDCOVER_BUDGET.supplementalFlowers,true,19);
  const count=(k:GroundcoverKind)=>out.filter(p=>p.kind===k).length;
  if(count("grass")!==GROUNDCOVER_BUDGET.totalGrass||
     count("flower")!==GROUNDCOVER_BUDGET.totalFlowers||
     count("shrub")!==GROUNDCOVER_BUDGET.shrubs||
     out.length!==GROUNDCOVER_BUDGET.total) {
    throw new Error("Instanced groundcover authoring budget changed");
  }
  return Object.freeze(out);
}
