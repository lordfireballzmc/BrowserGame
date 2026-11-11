import {describe,it,expect} from "vitest";
import {Box3,InstancedMesh,Matrix4,Vector3} from "three";
import {PAD_SITES} from "../src/art/terrain/Pads";
import {
  CARVED_PAD_STYLE,createSculptedTowerPads,
} from "../src/art/models/SculptedTowerPads";

const sites=PAD_SITES.map(p=>({
  x:p.x,y:0,z:p.z,unlockWave:p.unlockWave,
}));

describe("VQ.02e true in-game beveled 3D original tower sockets",()=>{
  it("replaces ten blue square display tops with 190 chiseled parts in five GPU batches",()=>{
    expect(CARVED_PAD_STYLE.count).toBe(10);
    expect(CARVED_PAD_STYLE.facets).toBe(8);
    const root=createSculptedTowerPads(sites);
    const meshes=root.children.filter(c=>c instanceof InstancedMesh) as InstancedMesh[];
    expect(meshes).toHaveLength(CARVED_PAD_STYLE.gpuBatches);
    expect(meshes.map(m=>m.count)).toEqual([10,10,10,80,80]);
    expect(meshes.reduce((sum,m)=>sum+m.count,0)).toBe(CARVED_PAD_STYLE.stonePieces);
    expect(meshes.every(m=>m.castShadow&&m.receiveShadow&&m.instanceColor!==null)).toBe(true);
    expect(root.name).toContain("Bastionfall-original-octagonal");
    // Same exact original 10 world site centers, with no extra collision body.
    const m=new Matrix4(),p=new Vector3();
    for(let i=0;i<sites.length;i++){
      meshes[0]!.getMatrixAt(i,m);
      p.setFromMatrixPosition(m);
      expect(p.x).toBeCloseTo(sites[i]!.x,8);
      expect(p.z).toBeCloseTo(sites[i]!.z,8);
      expect(p.y).toBeCloseTo(-0.02,8);
    }
    const geometryBounds=new Box3();
    for(const mesh of meshes){
      mesh.geometry.computeBoundingBox();
      geometryBounds.copy(mesh.geometry.boundingBox!);
      expect(Math.max(Math.abs(geometryBounds.min.x),
        Math.abs(geometryBounds.max.x))).toBeLessThanOrEqual(CARVED_PAD_STYLE.maxRadiusMeters);
      expect(Math.max(Math.abs(geometryBounds.min.z),
        Math.abs(geometryBounds.max.z))).toBeLessThanOrEqual(CARVED_PAD_STYLE.maxRadiusMeters);
      mesh.geometry.dispose();
      (mesh.material as {dispose:()=>void}).dispose();
    }
  });
  it("varies color for unlock wave, never fakes occupied or purchased towers",()=>{
    const root=createSculptedTowerPads(sites);
    const base=root.children[0] as InstancedMesh;
    const color=base.instanceColor!;
    const hasLocked=sites.findIndex(p=>p.unlockWave>1);
    const hasOpen=sites.findIndex(p=>p.unlockWave===1);
    expect(hasOpen).toBeGreaterThanOrEqual(0);
    expect(hasLocked).toBeGreaterThanOrEqual(0);
    const open=color.array.slice(hasOpen*3,hasOpen*3+3);
    const locked=color.array.slice(hasLocked*3,hasLocked*3+3);
    expect([...open]).not.toEqual([...locked]);
    expect(root.children.every(x=>x.name.includes("carved-pad"))).toBe(true);
    for(const mesh of root.children as InstancedMesh[]){
      mesh.geometry.dispose();(mesh.material as {dispose:()=>void}).dispose();
    }
  });
  it("rejects invalid terrain geometry and unauthorized pad unlock schedule",()=>{
    expect(()=>createSculptedTowerPads(sites.slice(1))).toThrow(RangeError);
    expect(()=>createSculptedTowerPads(sites.map((p,i)=>i===0?{...p,x:NaN}:p)))
      .toThrow(RangeError);
    expect(()=>createSculptedTowerPads(sites.map((p,i)=>i===0
      ?{...p,unlockWave:99}:p))).toThrow(RangeError);
  });
});
