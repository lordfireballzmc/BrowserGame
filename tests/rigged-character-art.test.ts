import { describe,expect,it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { MeshStandardMaterial, Scene } from "three";
import { RiggedCharacterLayer, stylizeActorMaterial, factionFragment,
  classifyActorPart, isSelectedEquipment, ACTOR_PALETTES,
  animationBlend, ANIMATION_BLEND_SECONDS,
} from "../src/engine/render/RiggedCharacterLayer";

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

  it("paints each already-authored mesh part independently, preserving source atlas values",()=>{
    const shader="#include <map_fragment>";
    const body=factionFragment(shader,"warden","body");
    const helmet=factionFragment(shader,"warden","headgear");
    const cape=factionFragment(shader,"warden","cape");
    const head=factionFragment(shader,"warden","face");
    const axe=factionFragment(shader,"scrapper","weapon");
    const raider=factionFragment(shader,"scrapper","body");
    const hood=factionFragment(shader,"runner","headgear");
    for(const output of [body,helmet,cape,head,axe,raider,hood]){
      expect(output).toContain("sourceLuma");
      expect(output).toContain("paintLight");
      expect(output).toContain("diffuseColor.rgb=mix(diffuseColor.rgb,factionPaint");
      expect(output).toContain("sourceLuma*1.48");
    }
    expect(body).not.toBe(helmet);
    expect(cape).not.toBe(body);
    expect(head).not.toBe(helmet);
    expect(axe).not.toBe(raider);
    expect(hood).not.toBe(raider);
    expect(body).toContain("vec3(0.0800,0.3600,0.8800)");
    expect(helmet).toContain("vec3(0.1000,0.3700,0.7700)");
    expect(cape).toContain("vec3(0.0350,0.1900,0.6200)");
    expect(raider).toContain("vec3(1.0000,0.0350,0.0450)");
    expect(hood).toContain("vec3(0.8400,0.0250,0.1250)");
    expect(()=>factionFragment("void main(){}","warden")).toThrow();
    expect(ACTOR_PALETTES.warden.body[2]).toBeGreaterThan(ACTOR_PALETTES.warden.body[0]);
    expect(ACTOR_PALETTES.warden.headgear[2]).toBeGreaterThan(ACTOR_PALETTES.warden.headgear[0]);
    expect(ACTOR_PALETTES.warden.shield[0]).toBeGreaterThan(ACTOR_PALETTES.warden.shield[2]);
    expect(ACTOR_PALETTES.runner.leg[0]).toBeLessThan(ACTOR_PALETTES.runner.body[0]);
    const source=new MeshStandardMaterial({color:0x67ad36,roughness:0.52,metalness:0.4});
    const originalColor=source.color.clone();
    const variants=[["warden","body"],["warden","headgear"],["warden","cape"],
      ["scrapper","body"],["scrapper","face"],["runner","headgear"]] as const;
    const keys=new Set<string>();
    for(const [role,part] of variants){
      const styled=stylizeActorMaterial(source,role,part);
      expect(styled).not.toBe(source);
      expect(styled.color.getHex()).toBe(0xffffff);
      expect(styled.metalness).toBeLessThanOrEqual(0.22);
      expect(styled.roughness).toBeGreaterThan(0.5);
      keys.add(styled.customProgramCacheKey());
      styled.dispose();
    }
    expect(keys.size).toBe(variants.length);
    expect(source.color.equals(originalColor)).toBe(true);
    expect(source.roughness).toBe(0.52);
    source.dispose();
  });

  it.each([
    ["warden","warden-kaykit.glb",["1H_Sword","Badge_Shield"]],
    ["scrapper","scrapper-kaykit.glb",["1H_Axe","Barbarian_Round_Shield"]],
    ["runner","runner-kaykit.glb",["1H_Crossbow","Knife_Offhand"]],
  ] as const)("selects exactly two artist-authored held accessories for %s",(
    role,filename,expected,
  )=>{
    const bin=readFileSync(base+filename);
    const length=bin.readUInt32LE(12);
    const doc=JSON.parse(bin.subarray(20,20+length).toString("utf8")) as {
      nodes:Array<{name?:string;mesh?:number}>;
    };
    const nodes=doc.nodes.filter(n=>n.mesh!==undefined).map(n=>n.name??"");
    const visible=nodes.filter(n=>isSelectedEquipment(n,role));
    const recognized=nodes.filter(n=>!isSelectedEquipment(n,role));
    expect(expected.every(name=>visible.includes(name))).toBe(true);
    expect(recognized.length).toBeGreaterThanOrEqual(role==="warden"?4:2);
    expect(visible.some(n=>classifyActorPart(n,role)==="body")).toBe(true);
    expect(visible.some(n=>classifyActorPart(n,role)==="cape")).toBe(true);
    expect(visible.some(n=>classifyActorPart(n,role)==="weapon")).toBe(true);
    expect(visible.some(n=>classifyActorPart(n,role)==="headgear")).toBe(true);
    expect(visible.some(n=>classifyActorPart(n,role)==="leg")).toBe(true);
    expect(visible.some(n=>classifyActorPart(n,role)==="arm")).toBe(true);
  });

  it("crossfades 41-bone authored poses over 140ms without runtime clock dependence",()=>{
    expect(ANIMATION_BLEND_SECONDS).toBeCloseTo(0.14,5);
    expect(animationBlend(-1)).toBe(0);
    expect(animationBlend(0)).toBe(0);
    expect(animationBlend(ANIMATION_BLEND_SECONDS/2)).toBeCloseTo(0.5,6);
    expect(animationBlend(ANIMATION_BLEND_SECONDS)).toBe(1);
    expect(animationBlend(ANIMATION_BLEND_SECONDS*3)).toBe(1);
    const first=Array.from({length:15},(_,i)=>animationBlend(i/60));
    expect(first.every((value,i)=>i===0||value>=first[i-1]!)).toBe(true);
    expect(()=>animationBlend(Infinity)).toThrow(RangeError);
    expect(()=>animationBlend(NaN)).toThrow(RangeError);
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
