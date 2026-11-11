/**
 * VQ.02e — Bastionfall's original sculpted 3D tower sockets.
 * Replaces the repeated *visual* blue-square Kenney pad display, never the
 * ten F2.03 world coordinates / buildable collision hit footprints.
 *
 * Beveled eight-stone perimeter, inset slate well, warm inset sockets and
 * short carved radial accents. 190 physical parts in just FIVE InstancedMesh
 * draws, retained as shared geometries with no per-frame model allocation.
 */
import {
  Color, CylinderGeometry, ExtrudeGeometry, Group, InstancedMesh, Matrix4,
  MeshStandardMaterial, Path, Quaternion, Shape, StaticDrawUsage, Vector3,
} from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

export interface CarvedPadPlacement {
  readonly x:number; readonly y:number; readonly z:number;
  readonly unlockWave:number;
}
export const CARVED_PAD_STYLE={
  count:10,
  facets:8,
  maxRadiusMeters:1.90,
  stonePieces:190,
  gpuBatches:5,
} as const;

const axis=new Vector3(0,1,0);
const turn=new Quaternion();
const matrix=new Matrix4();
const position=new Vector3();
const scale=new Vector3(1,1,1);
const angle=(i:number):number=>2*Math.PI*i/CARVED_PAD_STYLE.facets;

function carvedCurbGeometry():ExtrudeGeometry {
  const outer=new Shape();
  for(let i=0;i<=8;i++){
    const phi=angle(i)+Math.PI/8;
    const x=1.69*Math.cos(phi), y=1.69*Math.sin(phi);
    if(i===0)outer.moveTo(x,y);else outer.lineTo(x,y);
  }
  const hole=new Path();
  for(let i=8;i>=0;i--){
    const phi=angle(i)+Math.PI/8;
    const x=1.39*Math.cos(phi),y=1.39*Math.sin(phi);
    if(i===8)hole.moveTo(x,y);else hole.lineTo(x,y);
  }
  outer.holes.push(hole);
  const geometry=new ExtrudeGeometry(outer,{
    depth:0.13,steps:1,bevelEnabled:true,
    bevelSegments:2,bevelThickness:0.035,bevelSize:0.045,
    curveSegments:1,
  });
  geometry.rotateX(-Math.PI/2);
  geometry.computeVertexNormals();
  return geometry;
}

function batch(group:Group,name:string,
  geometry:InstanceType<typeof CylinderGeometry> | ExtrudeGeometry |
    RoundedBoxGeometry,
  roughness:number,metalness=0):InstancedMesh {
  const material=new MeshStandardMaterial({
    color:0xffffff,roughness,metalness,flatShading:false,
  });
  const count=name==="latch-plates"||name==="carved-radial-notches"?80:10;
  const mesh=new InstancedMesh(geometry,material,count);
  mesh.name="Bastionfall-carved-pad-"+name;
  mesh.instanceMatrix.setUsage(StaticDrawUsage);
  mesh.frustumCulled=false; // ten world sites share each batch
  mesh.receiveShadow=true;
  mesh.castShadow=true;
  group.add(mesh);
  return mesh;
}

function place(mesh:InstancedMesh,index:number,
  x:number,y:number,z:number,yaw:number,color:string):void {
  position.set(x,y,z);
  turn.setFromAxisAngle(axis,yaw);
  mesh.setMatrixAt(index,matrix.compose(position,turn,scale));
  mesh.setColorAt(index,new Color(color));
}

/**
 * The source CC0 castle remains intact. These independently authored five
 * spatial layers communicate an EMPTY build location through actual geometry.
 * The center is deliberately dark and recessed: no false permanent magic.
 */
export function createSculptedTowerPads(
  sites:readonly CarvedPadPlacement[],
):Group {
  if(sites.length!==CARVED_PAD_STYLE.count ||
    !sites.every(p=>[p.x,p.y,p.z,p.unlockWave].every(Number.isFinite) &&
      [1,2,4,7].includes(p.unlockWave))) {
    throw new RangeError("Sculpted 3D pad sites must match ten real pad positions");
  }
  const root=new Group();
  root.name="Bastionfall-original-octagonal-stone-and-brass-tower-sockets";
  const base=batch(root,"foundation",new CylinderGeometry(
    1.78,1.90,0.25,8,1,false),0.96);
  const inset=batch(root,"sunken-slate-well",new CylinderGeometry(
    1.35,1.38,0.09,8,1,false),0.92);
  const rim=batch(root,"beveled-stone-curb",carvedCurbGeometry(),0.87);
  const plates=batch(root,"latch-plates",
    new RoundedBoxGeometry(0.42,0.115,0.22,3,0.045),0.65,0.10);
  const marks=batch(root,"carved-radial-notches",
    new RoundedBoxGeometry(0.27,0.055,0.085,2,0.02),0.86);
  for(const [i,p] of sites.entries()){
    const accessible=p.unlockWave===1;
    const outer=accessible?"#9eada7":"#7a8481";
    const core=accessible?"#426879":"#45535b";
    const dressed=accessible?"#cebd9b":"#89928b";
    const metal=accessible?"#dcb764":"#7d867f";
    const etch=accessible?"#f0d28a":"#8e9e96";
    place(base,i,p.x,p.y-0.02,p.z,Math.PI/8,outer);
    place(inset,i,p.x,p.y+0.111,p.z,Math.PI/8,core);
    place(rim,i,p.x,p.y+0.15,p.z,0,dressed);
    for(let k=0;k<8;k++){
      const theta=angle(k)+Math.PI/8;
      const px=p.x+Math.cos(theta)*1.57;
      const pz=p.z+Math.sin(theta)*1.57;
      // Every curb has its own inset metal fastener, not giant flat corners.
      place(plates,i*8+k,px,p.y+0.284,pz,-theta,metal);
      // A second short chiseled radial mark adds focal detail with a separate
      // PBR material and exact same instance count, no new draw per socket.
      place(marks,i*8+k,
        p.x+Math.cos(theta)*1.18,p.y+0.183,
        p.z+Math.sin(theta)*1.18,-theta,etch);
    }
  }
  for(const b of [base,inset,rim,plates,marks]){
    b.instanceMatrix.needsUpdate=true;
    if(b.instanceColor)b.instanceColor.needsUpdate=true;
  }
  return root;
}
