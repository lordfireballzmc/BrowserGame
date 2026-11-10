import { describe,expect,it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateScenery,sceneryClearance } from "../src/art/scenery/Scenery";
import { SCENERY_ART_MODELS,SCENERY_ART_SOURCE,sceneryArtUrl } from "../src/art/assets/SceneryArtManifest";
import { sceneryArtScale,sceneryMaterialColor,sceneryModelForPlacement } from "../src/engine/render/SceneryArtLayer";

const scenery=generateScenery("fenwall-crossing-v1");
describe("VQ.02b source-pinned, batchable 3D trees and rocks",()=>{
  it("has seven byte-perfect original Kenney CC0 binaries with exact declared textures",()=>{
    expect(SCENERY_ART_SOURCE.artist).toBe("Kenney");
    expect(SCENERY_ART_SOURCE.license).toBe("CC0-1.0");
    expect(SCENERY_ART_SOURCE.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(SCENERY_ART_MODELS).toHaveLength(7);
    expect(new Set(SCENERY_ART_MODELS.map(x=>x.id)).size).toBe(7);
    expect(SCENERY_ART_MODELS.filter(x=>x.hasAtlas)).toHaveLength(2);
    for(const m of SCENERY_ART_MODELS){
      const b=readFileSync(join(process.cwd(),"public/assets/scenery",m.file));
      expect(b.length).toBe(m.bytes);
      expect(createHash("sha1").update("blob "+b.length+"\\0".replace("\\0","\0"))
        .update(b).digest("hex")).toBe(m.sourceGitBlob);
      expect(b.readUInt32LE(0)).toBe(0x46546c67);
      expect(b.readUInt32LE(4)).toBe(2);
      expect(b.readUInt32LE(8)).toBe(m.bytes);
      const jsonLength=b.readUInt32LE(12);
      expect(b.readUInt32LE(16)).toBe(0x4e4f534a);
      const j=JSON.parse(b.subarray(20,20+jsonLength).toString("utf8"));
      expect(j.asset.version).toBe("2.0");
      expect(j.meshes.length).toBeGreaterThan(0);
      expect(j.materials.length).toBeGreaterThan(0);
      expect(Boolean(j.textures?.length)).toBe(m.hasAtlas);
      expect(Boolean(j.images?.length)).toBe(m.hasAtlas);
      expect(sceneryArtUrl(m.file)).toContain("assets/scenery/");
      expect(m.sourcePath).toMatch(/^packs\/(nature-kit|castle-kit)\//);
    }
  });
  it("uses multiple actual silhouettes with deterministic 40 trees and 42 rocks",()=>{
    const counts=new Map<string,number>();
    for(const p of scenery.placements.filter(p=>["pine","broadleaf","rock"].includes(p.kind))){
      const asset=sceneryModelForPlacement(p);
      expect(asset.kind).toBe(p.kind);
      counts.set(asset.id,(counts.get(asset.id)??0)+1);
      expect(sceneryClearance(p.x,p.z,p.kind,p.scale)).toBe(true);
    }
    expect([...counts.values()].reduce((a,b)=>a+b,0)).toBe(82);
    expect([...counts.values()].sort((a,b)=>a-b)).toEqual([5,5,6,12,12,21,21]);
    for(const p of scenery.placements.filter(p=>p.kind==="pine"||p.kind==="broadleaf")){
      const source=sceneryModelForPlacement(p);
      expect(source.targetHeight).toBeGreaterThan(4);
    }
    expect(()=>sceneryModelForPlacement(scenery.placements.find(p=>p.kind==="flower")!))
      .toThrow(/high-mass/);
  });
  it("caps source dimensions to authored real clearance radius",()=>{
    expect(sceneryArtScale([0.8,1.3,0.9],1.2,1,4.6)).toBeGreaterThan(2);
    expect(sceneryArtScale([0.8,1.3,0.9],1.2,1,4.6)*0.9)
      .toBeLessThanOrEqual(2*1.2*0.9+0.00001);
    expect(()=>sceneryArtScale([0,2,1],1,1,4)).toThrow();
    expect(()=>sceneryArtScale([1,2,1],1,NaN,4)).toThrow();
  });
  it("repaints cyan raw source leaves to restrained green while retaining bark/rock differentiation",()=>{
    expect(sceneryMaterialColor("leafsDark")).toBe("#4f815f");
    expect(sceneryMaterialColor("leafsGreen")).toBe("#77a76e");
    expect(sceneryMaterialColor("woodBark")).toBe("#94724c");
    expect(sceneryMaterialColor("dirt")).toBe("#88816a");
    expect(sceneryMaterialColor("colormap")).toBeNull(); // preserve artist atlas
  });
});
