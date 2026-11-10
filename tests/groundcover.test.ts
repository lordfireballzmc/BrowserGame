import { describe,expect,it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateScenery,sceneryClearance } from "../src/art/scenery/Scenery";
import { generateGroundcover,GROUNDCOVER_BUDGET } from "../src/art/scenery/GroundcoverPlan";
import {
  GROUNDCOVER_FLOWERS,GROUNDCOVER_FOREST_NODES,GROUNDCOVER_SOURCE_INFO,
  groundcoverFlowerUrl,
} from "../src/art/assets/GroundcoverManifest";
import { SCENERY_ART_SOURCE } from "../src/art/assets/SceneryArtManifest";

const seed="fenwall-crossing-v1";
const source=generateScenery(seed);
const plan=generateGroundcover(seed,source.placements);
function jsonGlb(path:string):{nodes:{name?:string}[];meshes:{primitives:unknown[]}[];
  images?:unknown[];materials:{name?:string}[];asset:{version:string}} {
  const b=readFileSync(join(process.cwd(),"public/assets/scenery",path));
  expect(b.readUInt32LE(0)).toBe(0x46546c67);
  expect(b.readUInt32LE(4)).toBe(2);
  expect(b.readUInt32LE(8)).toBe(b.length);
  return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString("utf8"));
}
describe("VQ.02d GPU-batched original-artist 3D groundcover",()=>{
  it("validates real shared KayKit painted grass/bush source geometry and UV atlas",()=>{
    expect(GROUNDCOVER_SOURCE_INFO.forestArtist).toBe("Kay Lousberg (KayKit)");
    expect(GROUNDCOVER_SOURCE_INFO.forestLicense).toBe("CC0-1.0");
    const forest=jsonGlb(SCENERY_ART_SOURCE.file);
    expect(forest.images?.length).toBe(1);
    const names=new Set(forest.nodes.map(n=>n.name));
    expect(GROUNDCOVER_FOREST_NODES).toHaveLength(3);
    for(const asset of GROUNDCOVER_FOREST_NODES){
      expect(names.has(asset.sourceNode)).toBe(true);
      expect(asset.targetHeight).toBeGreaterThan(0.40);
      expect(asset.targetHeight).toBeLessThan(0.70);
    }
  });
  it("proves exact Git-blob SHA, CC0 and 3D PBR authoring of BOTH flower source files",()=>{
    expect(GROUNDCOVER_SOURCE_INFO.flowerArtist).toBe("Kenney");
    expect(GROUNDCOVER_SOURCE_INFO.flowerLicense).toBe("CC0-1.0");
    expect(GROUNDCOVER_SOURCE_INFO.mirrorCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(GROUNDCOVER_FLOWERS).toHaveLength(2);
    for(const asset of GROUNDCOVER_FLOWERS){
      const b=readFileSync(join(process.cwd(),"public/assets/scenery",asset.file));
      expect(b.length).toBe(asset.bytes);
      expect(createHash("sha1").update(Buffer.from("blob "+b.length+"\0"))
        .update(b).digest("hex")).toBe(asset.sourceGitBlob);
      const gltf=jsonGlb(asset.file);
      expect(gltf.asset.version).toBe("2.0");
      expect(gltf.meshes.length).toBeGreaterThanOrEqual(1);
      expect(gltf.meshes.some(m=>m.primitives.length>=2)).toBe(true);
      expect(gltf.materials.length).toBeGreaterThanOrEqual(2);
      expect(gltf.images??[]).toHaveLength(0); // honesty: solid-PBR color, not atlas
      expect(groundcoverFlowerUrl(asset.file)).toContain("assets/scenery/");
    }
  });
  it("honors unchanged F2.05 source, seeded 904 authored decorations and model budgets",()=>{
    expect(source.placements.length).toBe(258);
    expect(GROUNDCOVER_BUDGET.total).toBe(904);
    expect(plan).toHaveLength(904);
    expect(plan.filter(p=>p.kind==="grass")).toHaveLength(736);
    expect(plan.filter(p=>p.kind==="shrub")).toHaveLength(48);
    expect(plan.filter(p=>p.kind==="flower")).toHaveLength(120);
    expect(plan.filter(p=>p.origin==="supplemental")).toHaveLength(376);
    expect(plan.filter(p=>p.origin==="canonical")).toHaveLength(528);
    expect(generateGroundcover(seed,source.placements)).toEqual(plan);
    expect(generateGroundcover("alt-seed",generateScenery("alt-seed").placements))
      .not.toEqual(plan);
    expect(new Set(plan.map(p=>p.source))).toEqual(
      new Set(["grass","shrub-round","shrub-branch","flower-gold","flower-lilac"]));
    for(const p of plan){
      expect([p.x,p.y,p.z,p.variation,p.angle].every(Number.isFinite)).toBe(true);
      expect(sceneryClearance(p.x,p.z,p.kind==="shrub"?"grass":p.kind,
        p.kind==="shrub"?2.65:p.kind==="grass"?1.4:1.7)).toBe(true);
    }
  });
  it("refuses noncanonical gameplay scenery budgets rather than silently adding colliders",()=>{
    expect(()=>generateGroundcover(seed,source.placements.slice(1))).toThrow(/canonical/);
    expect(source.batches).toHaveLength(5);
    expect(source.counts.grass).toBe(152);
    expect(source.counts.flower).toBe(24);
  });
});
