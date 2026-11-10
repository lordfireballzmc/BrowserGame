import { describe, expect, it } from "vitest";
import { OrthoCamera } from "../src/engine/Camera";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { signedCoast, terrainHeight } from "../src/art/terrain/Island";
import { nearestRoadPoint, ROAD_SPEC } from "../src/art/terrain/RoadPath";
import {
  PAD_SITES,PAD_SPEC,createPadFoundation,createPadTargetRing,isPadUnlocked,
  padGroundHeight,pickPadAtGround,pickPadAtScreen,projectPadPrice,validatePadSites,
} from "../src/art/terrain/Pads";
import { MATERIAL_TOKENS } from "../src/engine/render/Palette";

describe("F2.03: authored ten-pad map contract",()=>{
  it("has exactly ten stable unique positions and the 2/2/3/3 unlock schedule",()=>{
    expect(PAD_SITES.map(s=>s.id)).toEqual(["P01","P02","P03","P04","P05","P06","P07","P08","P09","P10"]);
    expect(PAD_SITES.map(s=>s.unlockWave)).toEqual([1,1,2,2,4,4,4,7,7,7]);
    expect(()=>validatePadSites()).not.toThrow();
    for(const [wave,expected] of [[1,2],[2,4],[4,7],[7,10],[10,10]]){
      expect(PAD_SITES.filter(site=>isPadUnlocked(site,wave!))).toHaveLength(expected!);
    }
  });

  it("places every 4m footprint on land, at least 2m from the road edge",()=>{
    for(const site of PAD_SITES){
      const road=nearestRoadPoint(site.x,site.z);
      expect(road.lateralDistance-ROAD_SPEC.halfWidthMeters-PAD_SPEC.radiusMeters)
        .toBeGreaterThanOrEqual(2);
      for(const x of [site.x-2,site.x+2])for(const z of [site.z-2,site.z+2])
        expect(signedCoast(x,z)).toBeLessThan(-0.001);
      expect(Math.hypot(site.x-31,site.z-2)).toBeGreaterThanOrEqual(7.5);
    }
    for(let i=0;i<PAD_SITES.length;i++)for(let j=i+1;j<PAD_SITES.length;j++){
      const a=PAD_SITES[i]!,b=PAD_SITES[j]!;
      expect(Math.abs(a.x-b.x)>=4||Math.abs(a.z-b.z)>=4).toBe(true);
    }
  });

  it("rejects overlap, shoreline intrusion, blocked road and wrong unlocks",()=>{
    const altered=PAD_SITES.map(s=>({...s}));
    altered[1]={...altered[1]!,x:altered[0]!.x+1,z:altered[0]!.z};
    expect(()=>validatePadSites(altered)).toThrow();
    altered[1]={...PAD_SITES[1]!,unlockWave:7};
    expect(()=>validatePadSites(altered)).toThrow(/unlock/);
    altered[1]={...PAD_SITES[1]!,x:100};
    expect(()=>validatePadSites(altered)).toThrow(/island/);
  });

  it("reuses hard-shaded carved-octagon geometry with four engraved corners",()=>{
    const mesh=createPadFoundation();
    expect(mesh).toBe(createPadFoundation());
    expect(()=>validateGeometry(mesh)).not.toThrow();
    expect(mesh.indices.length/3).toBeGreaterThan(50);
    expect(mesh.bounds.min[0]).toBeCloseTo(-1.8,4);
    expect(mesh.bounds.max[0]).toBeCloseTo(1.8,4);
    expect(mesh.bounds.min[1]).toBeLessThan(-0.4);
    expect(mesh.bounds.max[1]).toBeGreaterThan(0.32);
    const materials=new Set(mesh.materialIds);
    expect(materials.has(MATERIAL_TOKENS.indexOf("stone.base")+1)).toBe(true);
    expect(materials.has(MATERIAL_TOKENS.indexOf("stone.shadow")+1)).toBe(true);
  });

  it("creates sixteen real upward-facing dashes in optional selection outline",()=>{
    const mesh=createPadTargetRing();
    expect(mesh).toBe(createPadTargetRing());
    expect(()=>validateGeometry(mesh)).not.toThrow();
    expect(mesh.indices.length/3).toBe(32);
    expect(mesh.bounds.min[1]).toBeGreaterThan(PAD_SPEC.topHeightMeters);
    expect(mesh.materialIds.every(id=>id===MATERIAL_TOKENS.indexOf("stone.highlight")+1)).toBe(true);
  });

  it("anchors foundations to the real seeded terrain in both map variants",()=>{
    for(const seed of ["fenwall-crossing-v1","fenwall-crossing-v2"]){
      for(const pad of PAD_SITES){
        expect(padGroundHeight(pad,seed)).toBe(terrainHeight(seed,pad.x,pad.z));
        expect(Math.abs(padGroundHeight(pad,seed))).toBeLessThan(0.5);
      }
    }
  });

  it("selects only within the correct unlocked 4x4 world hitbox",()=>{
    const first=PAD_SITES[0]!,locked=PAD_SITES[8]!;
    expect(pickPadAtGround(first.x,first.z,1)?.id).toBe(first.id);
    expect(pickPadAtGround(first.x+1.9,first.z+1.9,1)?.id).toBe(first.id);
    expect(pickPadAtGround(first.x+2.1,first.z,1)).toBeNull();
    expect(pickPadAtGround(locked.x,locked.z,1)).toBeNull();
    expect(pickPadAtGround(locked.x,locked.z,7)?.id).toBe(locked.id);
    expect(pickPadAtGround(0,23,10)).toBeNull();
  });

  it("round-trips actual camera CSS coordinates to the same selected pad",()=>{
    for(const [w,h] of [[1600,900],[750,1150]]){
      const camera=new OrthoCamera(w!,h!);
      for(const site of PAD_SITES){
        camera.snapTo([site.x,0,site.z]);
        const pos=camera.project([site.x,0,site.z]);
        expect(pos.visible).toBe(true);
        const hit=pickPadAtScreen(pos.x,pos.y,camera,10);
        expect(hit?.id).toBe(site.id);
      }
    }
  });

  it("anchors price text to camera projection, with no hard-coded pixel positions",()=>{
    const site=PAD_SITES[0]!,camera=new OrthoCamera(1600,900);
    camera.snapTo([site.x,0,site.z]);
    const projected=projectPadPrice(site,camera,1,25,"fenwall-crossing-v1");
    const expected=camera.project([site.x,padGroundHeight(site,"fenwall-crossing-v1")+1,site.z]);
    expect(projected).toMatchObject({
      id:site.id,text:"20 crowns",tone:"affordable",visible:true,
    });
    expect(projected.x).toBeCloseTo(expected.x,6);
    expect(projected.y).toBeCloseTo(expected.y,6);
    camera.resize(750,1150);
    const portrait=projectPadPrice(site,camera,1,25,"fenwall-crossing-v1");
    expect(portrait.x).not.toBe(projected.x);
    expect(portrait.y).not.toBe(projected.y);
  });

  it("shows locked wave label or unaffordable price without fake costs",()=>{
    const camera=new OrthoCamera(1600,900);
    const pending=projectPadPrice(PAD_SITES[9]!,camera,1,999,"fenwall-crossing-v1");
    expect(pending.text).toBe("Wave 7");
    expect(pending.tone).toBe("locked");
    const broke=projectPadPrice(PAD_SITES[0]!,camera,1,19,"fenwall-crossing-v1");
    expect(broke.text).toBe("20 crowns");
    expect(broke.tone).toBe("unaffordable");
  });

  it("validates wave, balance and hit-coordinate inputs",()=>{
    const site=PAD_SITES[0]!,cam=new OrthoCamera(1600,900);
    expect(()=>isPadUnlocked(site,0)).toThrow(RangeError);
    expect(()=>isPadUnlocked(site,11)).toThrow(RangeError);
    expect(()=>pickPadAtGround(NaN,0)).toThrow(RangeError);
    expect(()=>pickPadAtGround(0,Infinity)).toThrow(RangeError);
    expect(()=>projectPadPrice(site,cam,1,-1,"fenwall-crossing-v1")).toThrow(RangeError);
    expect(()=>projectPadPrice(site,cam,1,1.5,"fenwall-crossing-v1")).toThrow(RangeError);
  });
});
