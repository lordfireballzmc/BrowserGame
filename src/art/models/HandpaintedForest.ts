/**
 * ART.LOCK.01 — ACTUAL in-game, original painterly winding-tree silhouettes.
 *
 * The old KayKit lollipop spheres/cone trees are kept only behind ?art=legacy.
 * Normal Three/WebGL gameplay renders bespoke faceted gnarled trunks, two
 * crooked limbs per tree, and interlocking, flattened jagged brush canopies.
 *
 * All 40 authoritative seeded F2.05 tree placements, heights and angle seeds
 * are preserved, with zero gameplay collision changes. GPU instancing keeps
 * it to THREE draw groups, not hundreds of draw calls. Texture pigment comes
 * from a deterministic hand-brushed CanvasTexture baked ONCE at startup.
 *
 * This is an in-engine handcrafted geometry/material replacement, NOT the
 * user's attached image pasted into a quad and NOT yet final approved art.
 */
import {
  BufferGeometry,Color,Float32BufferAttribute,Group,InstancedMesh,
  Matrix4,MeshStandardMaterial,Quaternion,StaticDrawUsage,Vector3,
} from "three";
import type {SceneryPlacement} from "../scenery/Scenery";
import {makePainterlyTexture} from "../../engine/render/HandpaintedSurfaces";

export const PAINTERLY_TREE_BUDGET={
  treeCount:40,shrubCanopyLayers:144,branches:80,
  batches:3,maxHeight:6.25,
} as const;
type Vec3=readonly [number,number,number];
type TubePoint={position:Vec3;radius:number};
const UP=new Vector3(0,1,0);
const GOLD=new Color("#ffedb5");
const DARK=new Color("#a19772");
const barkShades=[0.74,0.87,1.02,0.81,1.08,0.78,0.96,0.83];
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));

/** No browser/canvas required for geometry creation, so CI verifies source. */
export function makeGnarledWoodGeometry(fork=false):BufferGeometry {
  const path:readonly TubePoint[]=fork?[
    {position:[0,1.30,0],radius:0.24},
    {position:[0.28,1.63,0.03],radius:0.225},
    {position:[0.62,1.99,0.16],radius:0.17},
    {position:[0.96,2.29,0.34],radius:0.11},
    {position:[1.29,2.51,0.43],radius:0.042},
  ]:[
    {position:[0,0,0],radius:0.49},
    {position:[0.13,0.32,-0.04],radius:0.41},
    {position:[0.29,0.82,-0.12],radius:0.33},
    {position:[0.43,1.40,-0.18],radius:0.30},
    {position:[0.26,1.90,0.04],radius:0.245},
    {position:[0.03,2.39,0.17],radius:0.190},
    {position:[-0.18,2.96,0.13],radius:0.140},
    {position:[-0.25,3.51,0.03],radius:0.055},
  ];
  const sides=8,vertices:number[]=[],uv:number[]=[],rgb:number[]=[],indices:number[]=[];
  for(let ring=0;ring<path.length;ring++){
    const p=path[ring]!;
    for(let facet=0;facet<sides;facet++){
      const angle=2*Math.PI*facet/sides+0.12*ring;
      const irregular=1+0.075*Math.sin(facet*2.73+ring*1.47);
      const x=p.position[0]+Math.cos(angle)*p.radius*irregular;
      const z=p.position[2]+Math.sin(angle)*p.radius*irregular;
      vertices.push(x,p.position[1],z);
      uv.push(facet/sides,ring/(path.length-1));
      const warm=barkShades[facet]!*(1+0.035*Math.sin(ring*2.7));
      rgb.push(warm,warm*(facet%2?0.94:0.87),warm*0.78);
      if(ring<path.length-1){
        const next=ring*sides+facet,side=ring*sides+(facet+1)%sides;
        const below=(ring+1)*sides+facet,bside=(ring+1)*sides+(facet+1)%sides;
        indices.push(next,below,side,side,below,bside);
      }
    }
  }
  // Root cap not exposed to top camera; stem tips hide under leaf crowns.
  const g=new BufferGeometry();
  g.setAttribute("position",new Float32BufferAttribute(vertices,3));
  g.setAttribute("normal",new Float32BufferAttribute(new Float32Array(vertices.length),3));
  g.setAttribute("color",new Float32BufferAttribute(rgb,3));
  g.setAttribute("uv",new Float32BufferAttribute(uv,2));
  g.setIndex(indices);
  g.computeVertexNormals();g.computeBoundingBox();
  return g;
}

/**
 * Broad flat crown with *irregularly scalloped, hand-cut* silhouette. Layered
 * rings make its depth physically legible, unlike a 2D billboard. The long
 * serrated tips mimic the user's ochre/olive painterly canopy reference.
 */
export function makeBrushCanopyGeometry():BufferGeometry {
  const segments=17;
  const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
  const rings=4;
  for(let ring=0;ring<rings;ring++){
    for(let i=0;i<segments;i++){
      const angle=i*2*Math.PI/segments;
      const chip=Math.sin(i*2.18)*0.16+Math.sin(i*4.74+0.42)*0.075;
      const radius=(ring===0?0.34:ring===1?0.86:ring===2?1.34:1.09)
        *(1+chip+Math.cos(angle)*0.045);
      const y=(ring===0?0.70:ring===1?0.49:ring===2?0.02:-0.22)
        +0.075*Math.sin(i*2.4+ring*0.55);
      const x=radius*Math.cos(angle)*1.13+ring*0.018;
      const z=radius*Math.sin(angle)*0.78;
      positions.push(x,y,z);
      uv.push(0.5+x/3.55,0.5+z/2.7);
      const light=ring===0?1.14:ring===1?1.08:ring===2?0.95:0.65;
      const d=light*(0.92+0.08*Math.sin(i*3.1));
      colors.push(d,clamp(d*0.985,0.4,1.16),d*0.80);
    }
  }
  for(let ring=0;ring<rings-1;ring++)
    for(let i=0;i<segments;i++){
      const next=(i+1)%segments,a=ring*segments+i,b=ring*segments+next;
      const c=(ring+1)*segments+i,d=(ring+1)*segments+next;
      indices.push(a,c,b,b,c,d);
    }
  // Top cap. Flat plane still has vertex shade breakups from radial rings.
  positions.push(0,0.80,0);uv.push(0.5,0.5);colors.push(1.08,1.08,0.89);
  for(let i=0;i<segments;i++)indices.push(rings*segments,i,(i+1)%segments);
  // Ragged brush-leaf tufts extend outer tips, avoiding perfect green blobs.
  for(let i=0;i<segments;i+=2){
    const angle=(i+0.55)*2*Math.PI/segments;
    const root=(2*segments+i);
    const x=1.69*Math.cos(angle),z=1.18*Math.sin(angle);
    const j=positions.length/3;
    positions.push(x,-0.08,z);
    uv.push(0.5+x/3.55,0.5+z/2.7);
    colors.push(0.75,0.8,0.52);
    indices.push(root,j,2*segments+(i+1)%segments);
  }
  const g=new BufferGeometry();
  g.setAttribute("position",new Float32BufferAttribute(positions,3));
  g.setAttribute("color",new Float32BufferAttribute(colors,3));
  g.setAttribute("uv",new Float32BufferAttribute(uv,2));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

export interface PaintedTreeSpec {
  readonly id:string;readonly x:number;readonly y:number;readonly z:number;
  readonly yaw:number;readonly size:number;readonly kind:"pine"|"broadleaf";
}
export function planPainterlyTrees(placements:readonly SceneryPlacement[]):readonly PaintedTreeSpec[] {
  const trees=placements.filter(p=>p.kind==="pine"||p.kind==="broadleaf");
  if(trees.length!==PAINTERLY_TREE_BUDGET.treeCount||
     trees.filter(t=>t.kind==="pine").length!==24||
     trees.filter(t=>t.kind==="broadleaf").length!==16)
    throw new RangeError("Painted silhouettes require the 40 real seeded tree sites");
  const out=trees.map(p=>{
    if(![p.x,p.y,p.z,p.rotation,p.scale,p.radius].every(Number.isFinite)||
       p.scale<=0)throw new RangeError("Nonfinite painterly tree site");
    return Object.freeze({
      id:p.id,x:p.x,y:p.y,z:p.z,yaw:p.rotation,
      size:p.kind==="pine"?0.99*p.scale:1.10*p.scale,
      kind:p.kind,
    } satisfies PaintedTreeSpec);
  });
  return Object.freeze(out);
}
/**
 * Three shared GPU draw groups: 40 trunks / 80 twisted branch arms / 144
 * overlapping asymmetric crowns. No new collision body or per-tick allocation.
 */
export function buildPainterlyForest(placements:readonly SceneryPlacement[]):Group {
  const trees=planPainterlyTrees(placements);
  const root=new Group();
  root.name="Bastionfall-ARTLOCK-original-gnarled-handpainted-forest";
  const wood=makePainterlyTexture("bark");
  const leaves=makePainterlyTexture("foliage");
  const trunkGeo=makeGnarledWoodGeometry(false);
  const branchGeo=makeGnarledWoodGeometry(true);
  const foliageGeo=makeBrushCanopyGeometry();
  const woodMaterial=new MeshStandardMaterial({
    color:"#ffffff",map:wood,vertexColors:true,roughness:1,metalness:0,
    flatShading:true,side:0,
  });
  const foliageMaterial=new MeshStandardMaterial({
    color:"#ffffff",map:leaves,vertexColors:true,roughness:1,metalness:0,
    flatShading:true,side:2,
  });
  const trunks=new InstancedMesh(trunkGeo,woodMaterial,trees.length);
  const branches=new InstancedMesh(branchGeo,woodMaterial,trees.length*2);
  const crowns=new InstancedMesh(foliageGeo,foliageMaterial,
    PAINTERLY_TREE_BUDGET.shrubCanopyLayers);
  for(const [mesh,name] of [[trunks,"twisted-trunks"],
    [branches,"crooked-branch-arms"],[crowns,"hand-cut-olive-canopies"]] as const){
    mesh.name="ARTLOCK-"+name;
    mesh.frustumCulled=false; // unchanged global terrain-scatter sites
    mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.instanceMatrix.setUsage(StaticDrawUsage);
    root.add(mesh);
  }
  const matrix=new Matrix4(),pos=new Vector3(),q=new Quaternion();
  const set=(mesh:InstancedMesh,i:number,x:number,y:number,z:number,
    yaw:number,sx:number,sy:number,sz:number)=>{
    pos.set(x,y,z);q.setFromAxisAngle(UP,yaw);
    mesh.setMatrixAt(i,matrix.compose(pos,q,new Vector3(sx,sy,sz)));
  };
  let branch=0,crown=0;
  for(const [i,p] of trees.entries()){
    const s=p.size,alpha=p.yaw;
    set(trunks,i,p.x,p.y,p.z,alpha,s,s,s);
    for(let j=0;j<2;j++){
      const turn=alpha+j*2.6+0.16*i;
      set(branches,branch++,p.x,p.y,p.z,turn,
        s*(j===0?1:0.87),s*(j===0?1:0.91),s);
    }
    // Branch-sitting overlapping caps; broadleaf is low/wide and wind-swept;
    // pine is tall layered and angular, NOT the old evergreen cone primitives.
    const count=p.kind==="pine"?4:3;
    const caps=p.kind==="pine"?
      [[-0.38,2.70,0,0.62],[0.35,3.18,0.19,0.71],
       [-0.25,3.82,-0.13,0.63],[0.24,4.26,0.04,0.45]]:
      [[-0.76,2.78,-0.02,0.90],[0.63,3.11,0.19,1.08],
       [-0.05,3.72,-0.13,1.11]];
    for(let k=0;k<count;k++){
      const [ox,oy,oz,scale]=caps[k]!;
      const c=Math.cos(alpha),sn=Math.sin(alpha);
      const x=p.x+(ox!*c-oz!*sn)*s,z=p.z+(ox!*sn+oz!*c)*s;
      const vary=1+0.09*Math.sin(i*2.72+k*3.13);
      set(crowns,crown++,x,p.y+oy!*s,z,
        alpha+0.43*k+i*0.18,scale!*s*vary,
        scale!*s*(0.85+0.04*k),scale!*s*(0.92+0.06*k));
    }
  }
  if(branch!==PAINTERLY_TREE_BUDGET.branches||
    crown!==PAINTERLY_TREE_BUDGET.shrubCanopyLayers)
    throw new Error("Original tree batch counts exceeded");
  for(const mesh of [trunks,branches,crowns]){
    mesh.instanceMatrix.needsUpdate=true;
  }
  // Geometry and texture ownership is held by root and disposed by sceneryArt.
  return root;
}
