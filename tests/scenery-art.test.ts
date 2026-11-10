import { describe,expect,it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateScenery,sceneryClearance } from "../src/art/scenery/Scenery";
import { SCENERY_ART_MODELS,SCENERY_ART_SOURCE,SCENERY_ROCK_SOURCES,
  SCENERY_ROCK_SOURCE_INFO,sceneryArtUrl,sceneryRockUrl } from "../src/art/assets/SceneryArtManifest";
import { sceneryArtScale,sceneryModelForPlacement } from "../src/engine/render/SceneryArtLayer";

const scenery=generateScenery("fenwall-crossing-v1");
describe("VQ.02b original KayKit CC0 forest and deterministic visual instancing",()=>{
  it("bundles ONE exact-source CC0 KayKit texture-atlas GLB, not seven repeated files",()=>{
    expect(SCENERY_ART_SOURCE.artist).toBe("Kay Lousberg (KayKit)");
    expect(SCENERY_ART_SOURCE.license).toBe("CC0-1.0");
    expect(SCENERY_ART_SOURCE.sourceRepository).toBe("Station-Sciences/bot-crossing");
    expect(SCENERY_ART_SOURCE.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(sceneryArtUrl()).toContain("assets/scenery/kaykit-forest-cc0.glb");
    const src=SCENERY_ART_SOURCE;
    const b=readFileSync(join(process.cwd(),"public/assets/scenery",src.file));
    expect(b.length).toBe(src.bytes);
    expect(createHash("sha1").update(Buffer.from("blob "+b.length+"\0"))
      .update(b).digest("hex")).toBe(src.sourceGitBlob);
    expect(b.readUInt32LE(0)).toBe(0x46546c67);
    expect(b.readUInt32LE(4)).toBe(2);
    expect(b.readUInt32LE(8)).toBe(src.bytes);
    expect(b.readUInt32LE(16)).toBe(0x4e4f534a);
    const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString("utf8"));
    expect(j.asset.version).toBe("2.0");
    expect(j.meshes.length).toBeGreaterThanOrEqual(16);
    expect(j.images.length).toBe(1);
    expect(j.textures.length).toBe(1);
    expect(j.materials.some((m:{pbrMetallicRoughness?:{baseColorTexture?:unknown}})=>
      Boolean(m.pbrMetallicRoughness?.baseColorTexture))).toBe(true);
    expect(j.images[0].bufferView).toBeTypeOf("number");
    const nodes=new Set(j.nodes.map((n:{name?:string})=>n.name));
    expect(SCENERY_ART_MODELS).toHaveLength(7);
    expect(new Set(SCENERY_ART_MODELS.map(x=>x.sourceNode)).size).toBe(7);
    for(const spec of SCENERY_ART_MODELS){
      expect(nodes.has(spec.sourceNode)).toBe(true);
      expect(spec.targetHeight).toBeGreaterThan(0.75);
    }
  });

  it("pins two rounded 3D stones to the exact approved Kenney CC0 Castle Kit files",()=>{
    expect(SCENERY_ROCK_SOURCE_INFO.originalArtist).toBe("Kenney");
    expect(SCENERY_ROCK_SOURCE_INFO.license).toBe("CC0-1.0");
    expect(SCENERY_ROCK_SOURCE_INFO.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(SCENERY_ROCK_SOURCES).toHaveLength(2);
    const ids=new Set(SCENERY_ART_MODELS.filter(x=>x.kind==="rock").map(x=>x.id));
    for(const asset of SCENERY_ROCK_SOURCES){
      expect(ids.has(asset.id)).toBe(true);
      expect(asset.sourcePath).toMatch(/^packs\/castle-kit\/rocks-/);
      expect(sceneryRockUrl(asset.file)).toContain("assets/scenery/");
      const bytes=readFileSync(join(process.cwd(),"public/assets/scenery",asset.file));
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(createHash("sha1").update(Buffer.from("blob "+bytes.length+"\\0"))
        .update(bytes).digest("hex")).toBe(asset.sourceGitBlob);
      expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
      const j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString("utf8"));
      expect(j.nodes.some((n:{name?:string})=>n.name===asset.sourceNode)).toBe(true);
      expect(j.materials.some((m:{pbrMetallicRoughness?:{baseColorTexture?:unknown}})=>
        Boolean(m.pbrMetallicRoughness?.baseColorTexture))).toBe(true);
    }
    expect(SCENERY_ART_MODELS.filter(x=>x.kind==="rock")
      .some(x=>x.sourceNode.startsWith("Rock_"))).toBe(false);
  });

  it("uses distinct modeled pine, canopy, and rock variants with canonical 82 sites",()=>{
    const count=new Map<string,number>();
    for(const p of scenery.placements.filter(p=>["pine","broadleaf","rock"].includes(p.kind))){
      const model=sceneryModelForPlacement(p);
      expect(model.kind).toBe(p.kind);
      count.set(model.id,(count.get(model.id)??0)+1);
      expect(sceneryClearance(p.x,p.z,p.kind,p.scale)).toBe(true);
    }
    expect([...count.values()].reduce((a,b)=>a+b,0)).toBe(82);
    expect([...count.values()].sort((a,b)=>a-b)).toEqual([5,5,6,12,12,21,21]);
    expect(()=>sceneryModelForPlacement(scenery.placements.find(p=>p.kind==="grass")!))
      .toThrow(/high-mass/);
  });

  it("caps artist canopy size to within carefully bounded scenery clearance",()=>{
    const s=sceneryArtScale([0.8,1.3,0.9],1.2,1,4.6);
    expect(s).toBeGreaterThan(2);
    expect(s*0.9).toBeLessThanOrEqual(2*1.2*1.28+0.0001);
    expect(()=>sceneryArtScale([0,2,1],1,1,4)).toThrow();
    expect(()=>sceneryArtScale([1,2,1],1,NaN,4)).toThrow();
  });
});
