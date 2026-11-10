/**
 * F2.05 — Original miniature biome prop archetypes, assembled ONCE.
 *
 * All assets use canonical semantic material slots and F1.03 indexed hard
 * normals. Instances carry rotation and scale; no mesh/GL allocations per
 * render frame. Every trunk/crown/rock/flower is geometry, not an emoji,
 * billboard, copied asset, fog or generated texture.
 */
import {
  facetedCylinder, facetedEllipsoid, validateGeometry,
  type Geometry, type Point3,
} from "../mesh/Primitives";
import { combineRigidParts, type RigidPart } from "../models/Archetypes";
import { MATERIAL_TOKENS, type MaterialToken } from "../../engine/render/Palette";

export type PropKind = "pine" | "broadleaf" | "rock" | "grass" | "flower";
export const PROP_KINDS = Object.freeze([
  "pine", "broadleaf", "rock", "grass", "flower",
] as const satisfies readonly PropKind[]);

type Part = RigidPart;
function part(
  name:string,parent:string|null,position:Point3,geometry:Geometry,
  material:MaterialToken,
):Part {
  return {name,parent,position,pivot:position,geometry,material};
}

function pine(): Geometry {
  return combineRigidParts([
    part("trunk",null,[0,1.38,0],facetedCylinder(0.24,2.76,7),"timber.base"),
    part("lower-cone","trunk",[0,2.52,0],facetedCylinder(1.16,1.64,7,0.18),"grass.shadow"),
    part("upper-cone","trunk",[0,4.14,0],facetedCylinder(0.79,1.60,7,0.12),"grass.primary"),
  ]);
}
function broadleaf(): Geometry {
  // Exactly three spatially separated 3D leaf volumes, no jagged spheres.
  return combineRigidParts([
    part("trunk",null,[0,1.55,0],facetedCylinder(0.27,3.1,7),"timber.base"),
    part("left-crown","trunk",[-0.73,3.81,0],
      facetedEllipsoid(0.66,0.66,0.63,8,4),"grass.shadow"),
    part("right-crown","trunk",[0.73,3.81,0],
      facetedEllipsoid(0.66,0.66,0.63,8,4),"grass.primary"),
    part("upper-crown","trunk",[0,5.05,0],
      facetedEllipsoid(0.58,0.62,0.57,8,4),"grass.primary"),
  ]);
}
function rock(): Geometry {
  // Three nonuniform but coherent faceted boulders, all attached to ground.
  return combineRigidParts([
    part("basal-stone",null,[-0.41,0.33,0.04],
      facetedEllipsoid(0.68,0.39,0.48,6,3),"stone.base"),
    part("side-stone","basal-stone",[0.42,0.29,-0.08],
      facetedEllipsoid(0.49,0.33,0.42,6,3),"stone.shadow"),
    part("back-stone","basal-stone",[0.04,0.36,0.39],
      facetedEllipsoid(0.38,0.35,0.31,6,3),"stone.base"),
  ]);
}

/** Small double-faced intersecting geometry; backface culling stays enabled. */
class FacetFlowers {
  private readonly positions:number[]=[];
  private readonly normals:number[]=[];
  private readonly materials:number[]=[];
  private readonly indices:number[]=[];

  private addFace(a:Point3,b:Point3,c:Point3,token:MaterialToken):void {
    const ab:[number,number,number]=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
    const ac:[number,number,number]=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const nx=ab[1]*ac[2]-ab[2]*ac[1];
    const ny=ab[2]*ac[0]-ab[0]*ac[2];
    const nz=ab[0]*ac[1]-ab[1]*ac[0];
    const length=Math.hypot(nx,ny,nz);
    if(length<=1e-10)throw new Error("Zero-area decorative blade");
    const normal:[number,number,number]=[nx/length,ny/length,nz/length];
    const back:[number,number,number]=[-normal[0],-normal[1],-normal[2]];
    const slot=MATERIAL_TOKENS.indexOf(token)+1;
    for(const [points,n] of [[[a,b,c],normal],[[c,b,a],back]] as const){
      const start=this.positions.length/3;
      for(const p of points){
        this.positions.push(...p);this.normals.push(...n);this.materials.push(slot);
      }
      this.indices.push(start,start+1,start+2);
    }
  }

  grass():Geometry {
    for(let i=0;i<3;i++){
      const angle=i*Math.PI/3, ca=Math.cos(angle),sa=Math.sin(angle);
      const base:[number,number,number]=[-0.09*ca,0.015,-0.09*sa];
      const opposite:[number,number,number]=[0.09*ca,0.015,0.09*sa];
      const tip:[number,number,number]=[
        0.055*Math.sin(angle),0.34-0.05*(i%2),-0.055*Math.cos(angle),
      ];
      this.addFace(base,opposite,tip,i===0?"grass.dry":"grass.shadow");
    }
    return this.finish();
  }

  flower():Geometry {
    // Two visible ivory corolla faces cross over a single small green stem.
    for(let i=0;i<2;i++){
      const angle=i*Math.PI/2,ca=Math.cos(angle),sa=Math.sin(angle);
      const left:[number,number,number]=[-.085*ca,.34,-.085*sa];
      const right:[number,number,number]=[.085*ca,.34,.085*sa];
      this.addFace(left,right,[0,.48,0],"ivory");
    }
    // Triangular stalk, tiny enough not to read as multicolored confetti.
    this.addFace([-.018,0,0],[.018,0,0],[0,.35,0],"grass.shadow");
    return this.finish();
  }

  private finish():Geometry {
    const positions=new Float32Array(this.positions);
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<positions.length;i+=3)for(let j=0;j<3;j++){
      min[j]=Math.min(min[j]!,positions[i+j]!);
      max[j]=Math.max(max[j]!,positions[i+j]!);
    }
    const mesh:Geometry={
      positions,normals:new Float32Array(this.normals),
      materialIds:new Uint8Array(this.materials),
      indices:positions.length/3<=65535?
        new Uint16Array(this.indices):new Uint32Array(this.indices),
      bounds:{min:[min[0]!,min[1]!,min[2]!],max:[max[0]!,max[1]!,max[2]!]},
    };
    validateGeometry(mesh);
    return mesh;
  }
}
const cache=new Map<PropKind,Geometry>();
export function getPropMesh(kind:PropKind):Geometry {
  const previous=cache.get(kind);
  if(previous)return previous;
  const mesh=kind==="pine"?pine():kind==="broadleaf"?broadleaf():
    kind==="rock"?rock():kind==="grass"?new FacetFlowers().grass():new FacetFlowers().flower();
  validateGeometry(mesh);
  cache.set(kind,mesh);
  return mesh;
}
