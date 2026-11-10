/** F2.03 — fixed, validated Fenwall Crossing tower pads and projected labels. */
import { bevelBox, facetedCylinder, validateGeometry, type Geometry, type Point3 } from "../mesh/Primitives";
import { combineRigidParts, type RigidPart } from "../models/Archetypes";
import { nearestRoadPoint, ROAD_SPEC } from "./RoadPath";
import { signedCoast, terrainHeight } from "./Island";
import { MATERIAL_TOKENS } from "../../engine/render/Palette";
import { BALANCE } from "../../game/Balance";
import type { OrthoCamera } from "../../engine/Camera";

export const PAD_SPEC = {
  radiusMeters: 1.8, footprintMeters: 4, interactionHalfExtentMeters: 2,
  minimumRoadEdgeGapMeters: 2, topHeightMeters: 0.315,
  labelHeightMeters: 1.0,
  defaultPrice: BALANCE.towers.boltSpire.costCrowns,
} as const;
export type PadId = "P01"|"P02"|"P03"|"P04"|"P05"|"P06"|"P07"|"P08"|"P09"|"P10";
export interface PadSite {
  readonly id: PadId;
  readonly x: number;
  readonly z: number;
  readonly unlockWave: 1 | 2 | 4 | 7;
}
/** Explicit authored world coordinates; P06 avoids overlapping P04's footprint. */
export const PAD_SITES: readonly PadSite[] = Object.freeze([
  { id:"P01", x:-27.8250, z:-0.0496, unlockWave:1 },
  { id:"P02", x:-14.5310, z:-7.4179, unlockWave:1 },
  { id:"P03", x:-19.7539, z:9.0559, unlockWave:2 },
  { id:"P04", x:-6.2406, z:-0.2843, unlockWave:2 },
  { id:"P05", x:1.8773, z:12.9104, unlockWave:4 },
  { id:"P06", x:-0.2884, z:-6.5406, unlockWave:4 },
  { id:"P07", x:12.2891, z:2.1659, unlockWave:4 },
  { id:"P08", x:13.2995, z:-14.1030, unlockWave:7 },
  { id:"P09", x:17.9568, z:0.4221, unlockWave:7 },
  { id:"P10", x:31.7920, z:-7.7761, unlockWave:7 },
].map(s => Object.freeze(s)));

function validWave(wave: number): void {
  if (!Number.isInteger(wave) || wave < 1 || wave > 10)
    throw new RangeError("Wave must be an integer from 1 through 10");
}
export function isPadUnlocked(site: PadSite, wave: number): boolean {
  validWave(wave);
  return wave >= site.unlockWave;
}
export function padGroundHeight(site: PadSite, seed: string | number): number {
  return terrainHeight(seed, site.x, site.z);
}

/** One cached, genuine eight-sided carved-stone foundation and four engraved notches. */
let foundation: Geometry | undefined;
export function createPadFoundation(): Geometry {
  if (foundation) return foundation;
  const parts: RigidPart[] = [
    { name:"foundation", parent:null, position:[0,-0.11,0], pivot:[0,-0.11,0],
      material:"stone.shadow", geometry:facetedCylinder(1.8,0.65,8) },
    { name:"beveled-face", parent:"foundation", position:[0,0.255,0],
      pivot:[0,0.255,0], material:"stone.base",
      geometry:facetedCylinder(1.8,0.12,8,1.68) },
  ];
  for (let i=0; i<4; i++) {
    const angle = Math.PI/4 + i*Math.PI/2;
    const position:Point3 = [1.3*Math.cos(angle),0.326,1.3*Math.sin(angle)];
    parts.push({ name:"engraved-notch-"+i, parent:"beveled-face",
      position, pivot:position, rotationY:-angle,
      material:"stone.shadow", geometry:bevelBox(0.32,0.018,0.11,0.005) });
  }
  foundation=combineRigidParts(parts);
  validateGeometry(foundation);
  return foundation;
}

/** Sixteen dashed planar outline segments, only drawn on target selection. */
let ring: Geometry | undefined;
export function createPadTargetRing(): Geometry {
  if (ring) return ring;
  const positions:number[]=[], normals:number[]=[], slots:number[]=[], indices:number[]=[];
  const slot=MATERIAL_TOKENS.indexOf("stone.highlight")+1, y=0.338;
  for(let segment=0;segment<16;segment++){
    const a=2*Math.PI*(segment+0.10)/16, b=2*Math.PI*(segment+0.64)/16;
    const points:Point3[]=[
      [1.92*Math.cos(a),y,1.92*Math.sin(a)],
      [2.07*Math.cos(a),y,2.07*Math.sin(a)],
      [2.07*Math.cos(b),y,2.07*Math.sin(b)],
      [1.92*Math.cos(b),y,1.92*Math.sin(b)],
    ];
    const start=positions.length/3;
    for(const p of points){positions.push(...p);normals.push(0,1,0);slots.push(slot)}
    indices.push(start,start+2,start+1,start,start+3,start+2);
  }
  const pts=new Float32Array(positions);
  const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<pts.length;i+=3)for(let a=0;a<3;a++){
    low[a]=Math.min(low[a]!,pts[i+a]!);high[a]=Math.max(high[a]!,pts[i+a]!);
  }
  ring={positions:pts,normals:new Float32Array(normals),
    materialIds:new Uint8Array(slots),indices:new Uint16Array(indices),
    bounds:{min:[low[0]!,low[1]!,low[2]!],max:[high[0]!,high[1]!,high[2]!]}};
  validateGeometry(ring);
  return ring;
}

/** Validate the whole 4×4 tower footprint and the exact road-edge clearance. */
export function validatePadSites(sites:readonly PadSite[]=PAD_SITES):void {
  if(sites.length!==10)throw new Error("Exactly ten pads are required");
  const ids=new Set<string>();
  for(const site of sites){
    if(ids.has(site.id)||!Number.isFinite(site.x)||!Number.isFinite(site.z))
      throw new Error("Duplicate or invalid pad site");
    ids.add(site.id);
    const gap=nearestRoadPoint(site.x,site.z).lateralDistance
      - ROAD_SPEC.halfWidthMeters - PAD_SPEC.radiusMeters;
    if(gap < PAD_SPEC.minimumRoadEdgeGapMeters)
      throw new Error("Pad violates road shoulder clearance: "+site.id);
    for(const x of [site.x-2,site.x+2])for(const z of [site.z-2,site.z+2])
      if(signedCoast(x,z)>=-0.001)throw new Error("Pad crosses island boundary: "+site.id);
    if(Math.hypot(site.x-31,site.z-2)<7.5)
      throw new Error("Pad blocks keep: "+site.id);
  }
  for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++){
    const a=sites[i]!,b=sites[j]!;
    if(Math.abs(a.x-b.x)<4&&Math.abs(a.z-b.z)<4)
      throw new Error("Two 4×4 tower footprints overlap");
  }
  for(const [wave,count]of [[1,2],[2,4],[4,7],[7,10]]){
    if(sites.filter(s=>wave!>=s.unlockWave).length!==count)
      throw new Error("Incorrect authored pad unlock schedule");
  }
}

/** World-space 4×4 interaction square; clicking locked pads never selects them. */
export function pickPadAtGround(x:number,z:number,wave=1):PadSite|null {
  if(!Number.isFinite(x)||!Number.isFinite(z))
    throw new RangeError("Pad hit location must be finite");
  validWave(wave);
  let best:PadSite|null=null, bestDistance=Infinity;
  for(const site of PAD_SITES){
    if(!isPadUnlocked(site,wave))continue;
    const dx=x-site.x,dz=z-site.z;
    if(Math.abs(dx)>2||Math.abs(dz)>2)continue;
    const d=dx*dx+dz*dz;
    if(d<bestDistance){bestDistance=d;best=site}
  }
  return best;
}
export function pickPadAtScreen(x:number,y:number,camera:Pick<OrthoCamera,"screenToGround">,wave=1):PadSite|null{
  const world=camera.screenToGround(x,y);
  return world?pickPadAtGround(world[0],world[2],wave):null;
}

export type PadPriceTone="affordable"|"unaffordable"|"locked";
export interface PadPriceProjection{
  readonly id:PadId; readonly text:string; readonly tone:PadPriceTone;
  readonly x:number;readonly y:number;readonly depth:number;readonly visible:boolean;
}
/** Project real 3D pad anchor into CSS-pixel coordinates via the rendering camera. */
export function projectPadPrice(
  site:PadSite,camera:Pick<OrthoCamera,"project">,wave:number,
  crowns:number,seed:string|number,
):PadPriceProjection{
  validWave(wave);
  if(!Number.isSafeInteger(crowns)||crowns<0)
    throw new RangeError("Crown balance must be a nonnegative integer");
  const unlocked=isPadUnlocked(site,wave);
  const tone:PadPriceTone=!unlocked?"locked":crowns>=PAD_SPEC.defaultPrice?"affordable":"unaffordable";
  const point=camera.project([site.x,padGroundHeight(site,seed)+PAD_SPEC.labelHeightMeters,site.z]);
  return{ id:site.id,
    text:unlocked?String(PAD_SPEC.defaultPrice)+" crowns":"Wave "+site.unlockWave,
    tone,x:point.x,y:point.y,depth:point.depth,visible:point.visible };
}
