import { describe,expect,it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Scene } from "three";
import { RiggedCharacterLayer } from "../src/engine/render/RiggedCharacterLayer";

const base="public/assets/characters/";
const manifest=JSON.parse(readFileSync(base+"manifest.json","utf8")) as {
  sourceCommit:string;upstream:string;
  characters:Array<{
    role:string;artistModel:string;license:string;bytes:number;
    sha256:string;sourceGitBlob:string;sourceCommit:string;clips:string[];
    skins:number;meshes:number;textures:number;
  }>;
};
const REQUIRED=["Idle","Walk","Run","Attack","Death"];

describe("ART.03a reproducible artist-authored mobile animation GLBs",()=>{
  it("pins exact upstream source hashes and CC0 terms for three cohesive original fantasy actors",()=>{
    expect(manifest.characters.map(c=>c.role)).toEqual(["warden","scrapper","runner"]);
    expect(manifest.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    for(const item of manifest.characters){
      expect(item.sourceCommit).toBe(manifest.sourceCommit);
      expect(item.sourceGitBlob).toMatch(/^[0-9a-f]{40}$/);
      expect(item.license).toBe("CC0-1.0");
      expect(item.clips).toEqual(REQUIRED);
      expect(item.skins).toBeGreaterThan(0);
      expect(item.meshes).toBeGreaterThan(1);
      expect(item.textures).toBeGreaterThan(0);
    }
  });

  it.each(["warden","scrapper","runner"])("%s is a valid checksum-pinned skinned and animated GLB under 1.65MB",role=>{
    const item=manifest.characters.find(c=>c.role===role)!;
    const path=base+role+"-kaykit.glb";
    const bin=readFileSync(path);
    const sha=createHash("sha256").update(bin).digest("hex");
    expect(sha).toBe(item.sha256);
    expect(readFileSync(base+role+"-kaykit.sha256","utf8").trim())
      .toBe(sha+"  "+role+"-kaykit.glb");
    expect(bin.length).toBe(item.bytes);
    expect(bin.length).toBeGreaterThan(15000);
    expect(bin.length).toBeLessThan(1_650_000);
    expect(bin.readUInt32LE(0)).toBe(0x46546c67);
    expect(bin.readUInt32LE(4)).toBe(2);
    expect(bin.readUInt32LE(8)).toBe(bin.length);
    expect(bin.readUInt32LE(16)).toBe(0x4e4f534a);
    const jsonLength=bin.readUInt32LE(12);
    const doc=JSON.parse(bin.subarray(20,20+jsonLength).toString("utf8"));
    expect(doc.asset.version).toBe("2.0");
    expect(doc.animations.map((a:{name:string})=>a.name)).toEqual(REQUIRED);
    expect(doc.skins.length).toBe(item.skins);
    expect(doc.meshes.length).toBe(item.meshes);
    expect(doc.images.length).toBe(item.textures);
    expect(doc.nodes.some((n:{skin?:number})=>n.skin!==undefined)).toBe(true);
    expect(doc.buffers).toHaveLength(1);
    expect(doc.buffers[0].uri).toBeUndefined();
    const views=doc.bufferViews as Array<{byteOffset?:number;byteLength:number}>;
    for(const accessor of doc.accessors as Array<{bufferView?:number}>) {
      if(accessor.bufferView!==undefined){
        expect(accessor.bufferView).toBeGreaterThanOrEqual(0);
        expect(accessor.bufferView).toBeLessThan(views.length);
      }
    }
    expect(doc.animations.every((anim:{samplers:Array<unknown>;channels:Array<unknown>})=>
      anim.samplers.length>0 && anim.channels.length>0)).toBe(true);
  });

  it("validates deterministic visual-only animation clocks without requiring WebGL",()=>{
    const rig=new RiggedCharacterLayer(new Scene());
    const matrix=new Float32Array(16);
    expect(()=>rig.setTime(-1)).toThrow(RangeError);
    expect(()=>rig.setTime(NaN)).toThrow(RangeError);
    expect(()=>rig.setMotion(matrix,"Run",Infinity)).toThrow(RangeError);
    expect(()=>rig.setMotion(matrix,"Fly" as "Idle",0)).toThrow(RangeError);
    rig.setTime(45/60);
    rig.setMotion(matrix,"Walk",3.2);
    expect(rig.ready).toBe(false); // never claim a source asset loaded based on manifest only
    expect(rig.sync([]).size).toBe(0);
    rig.dispose();
    expect(()=>rig.setTime(2)).not.toThrow(); // no game state coupled to visual clock
    expect(()=>rig.load()).rejects.toThrow("disposed");
  });
});
