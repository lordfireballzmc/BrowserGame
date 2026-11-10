import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  ENVIRONMENT_MODELS, ENVIRONMENT_SOURCE, environmentModelUrl,
} from "../src/art/assets/EnvironmentManifest";
import { PAD_SITES, pickPadAtGround, validatePadSites } from "../src/art/terrain/Pads";

/** Rebuild the actual Git object SHA to prove that locally bundled binary
 * textures/meshes are byte-identical to the exact source revision. */
function gitBlobSha(bytes:Buffer):string {
  return createHash("sha1").update("blob "+bytes.byteLength+"\0")
    .update(bytes).digest("hex");
}
describe("VQ.02 source-pinned artist-authored CC0 environment assets",()=>{
  it("pins six unique locally bundled models to an exact original CC0 source revision",()=>{
    expect(ENVIRONMENT_SOURCE.artist).toBe("Kenney");
    expect(ENVIRONMENT_SOURCE.license).toBe("CC0-1.0");
    expect(ENVIRONMENT_SOURCE.sourceRepository).toBe("Hidencod/tge-assets");
    expect(ENVIRONMENT_SOURCE.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(ENVIRONMENT_MODELS).toHaveLength(6);
    expect(new Set(ENVIRONMENT_MODELS.map(x=>x.id)).size).toBe(6);
    for(const art of ENVIRONMENT_MODELS){
      const file=join(process.cwd(),"public","assets","environment",art.file);
      const bytes=readFileSync(file);
      expect(statSync(file).size).toBe(art.bytes);
      expect(gitBlobSha(bytes)).toBe(art.sourceGitBlob);
      expect(art.sourcePath).toMatch(/^packs\/(castle-kit|tower-defense-kit)\//);
      expect(environmentModelUrl(art.file)).toContain("assets/environment/");
    }
  });

  it("uses real textured glTF meshes, not placeholder primitives or untextured shells",()=>{
    for(const art of ENVIRONMENT_MODELS){
      const bytes=readFileSync(join(process.cwd(),"public","assets","environment",art.file));
      expect(bytes.readUInt32LE(0)).toBe(0x46546c67); // glTF / GLB
      expect(bytes.readUInt32LE(4)).toBe(2); // glTF version 2
      expect(bytes.readUInt32LE(8)).toBe(bytes.length);
      const jsonLength=bytes.readUInt32LE(12);
      expect(bytes.readUInt32LE(16)).toBe(0x4e4f534a); // JSON chunk
      const json=JSON.parse(bytes.subarray(20,20+jsonLength).toString("utf8"));
      expect(json.asset.version).toBe("2.0");
      expect(json.meshes.length).toBeGreaterThan(0);
      expect(json.accessors.length).toBeGreaterThan(0);
      expect(json.textures.length).toBeGreaterThan(0);
      expect(json.images.length).toBeGreaterThan(0);
      expect(json.materials.some((m:{pbrMetallicRoughness?:{
        baseColorTexture?:unknown}})=>Boolean(m.pbrMetallicRoughness?.baseColorTexture)))
        .toBe(true);
      expect(json.images.every((img:{bufferView?:number;uri?:string})=>
        img.bufferView!==undefined && !img.uri)).toBe(true);
    }
  });

  it("keeps gameplay pad layout and early unlock schedule identical",()=>{
    expect(()=>validatePadSites()).not.toThrow();
    expect(PAD_SITES.map(s=>s.unlockWave)).toEqual([1,1,2,2,4,4,4,7,7,7]);
    for(const site of PAD_SITES){
      const picked=pickPadAtGround(site.x,site.z,1);
      expect(picked?.id??null).toBe(site.unlockWave===1?site.id:null);
    }
  });
});
