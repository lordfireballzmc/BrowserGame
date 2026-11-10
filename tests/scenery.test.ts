import { describe, expect, it } from "vitest";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { MATERIAL_TOKENS } from "../src/engine/render/Palette";
import { terrainHeight, signedCoast } from "../src/art/terrain/Island";
import { PAD_SITES } from "../src/art/terrain/Pads";
import { nearestRoadPoint, ROAD_SPEC } from "../src/art/terrain/RoadPath";
import { riverCenterZ,riverOuterBankWidth } from "../src/art/terrain/RiverPath";
import { getPropMesh, PROP_KINDS } from "../src/art/scenery/PropMeshes";
import { generateScenery, sceneryClearance, SCENERY_SPEC } from "../src/art/scenery/Scenery";

const seed="fenwall-crossing-v1";
const scene=generateScenery(seed);

describe("F2.05 original deterministic stage decoration",()=>{
  it("places all five types with exact, bounded, author-approved instance counts",()=>{
    expect(PROP_KINDS).toEqual(["pine","broadleaf","rock","grass","flower"]);
    for(const kind of PROP_KINDS){
      expect(scene.counts[kind]).toBe(SCENERY_SPEC[kind].count);
      expect(scene.batches.find(b=>b.kind===kind)?.count).toBe(SCENERY_SPEC[kind].count);
    }
    expect(scene.batches).toHaveLength(5);
    expect(scene.placements).toHaveLength(24+16+42+152+24);
    expect(scene.rejectedCandidates).toBeGreaterThan(0);
    expect(scene.rejectedCandidates).toBeLessThan(100000);
  });

  it("builds reusable valid indexed mesh geometry and only canonical palette colors",()=>{
    for(const kind of PROP_KINDS){
      const mesh=getPropMesh(kind);
      expect(mesh).toBe(getPropMesh(kind));
      expect(()=>validateGeometry(mesh)).not.toThrow();
      expect(mesh.indices.length).toBeGreaterThan(0);
      expect(mesh.positions.length).toBeGreaterThan(9);
      expect([...mesh.materialIds].every(x=>x>0&&x<=MATERIAL_TOKENS.length)).toBe(true);
    }
    expect(getPropMesh("flower").materialIds).toContain(MATERIAL_TOKENS.indexOf("ivory")+1);
    expect(getPropMesh("grass").materialIds).toContain(MATERIAL_TOKENS.indexOf("grass.dry")+1);
  });

  it("has two distinctive grounded 2.6-5.8m tree heights and distinct rock clusters",()=>{
    for(const tree of ["pine","broadleaf"] as const){
      const mesh=getPropMesh(tree);
      expect(mesh.bounds.min[1]).toBeGreaterThanOrEqual(-0.001);
      expect(mesh.bounds.max[1]).toBeGreaterThan(2.6);
      expect(mesh.bounds.max[1]).toBeLessThanOrEqual(5.8);
      expect(mesh.bounds.max[0]!-mesh.bounds.min[0]!).toBeGreaterThan(1.4);
    }
    // Enforce the *scaled world instance*, not only its unscaled mesh height.
    for(const placement of scene.placements.filter(p=>p.kind==="pine"||p.kind==="broadleaf")){
      const mesh=getPropMesh(placement.kind);
      const tall=mesh.bounds.max[1]*placement.scale;
      expect(tall).toBeGreaterThan(2.6);
      expect(tall).toBeLessThanOrEqual(5.8);
    }
    expect(getPropMesh("pine").positions).not.toEqual(getPropMesh("broadleaf").positions);
    const rock=getPropMesh("rock");
    expect(rock.bounds.max[1]).toBeLessThan(1);
    expect(rock.bounds.min[1]).toBeGreaterThan(-0.25);
    expect(rock.materialIds).toContain(MATERIAL_TOKENS.indexOf("stone.shadow")+1);
  });

  it("keeps every actual prop footprint on the clipped island",()=>{
    for(const p of scene.placements){
      expect(sceneryClearance(p.x,p.z,p.kind,p.scale)).toBe(true);
      for(let i=0;i<8;i++){
        const a=2*Math.PI*i/8;
        expect(signedCoast(p.x+Math.cos(a)*(p.radius+0.2),
          p.z+Math.sin(a)*(p.radius+0.2))).toBeLessThan(-0.002);
      }
    }
  });

  it("never obscures the road, entry, 7m keep or any authored build square",()=>{
    for(const p of scene.placements){
      const cfg=SCENERY_SPEC[p.kind];
      const roadGap=nearestRoadPoint(p.x,p.z).lateralDistance
        -ROAD_SPEC.halfWidthMeters-p.radius;
      expect(roadGap).toBeGreaterThanOrEqual(cfg.roadGap-1e-4);
      for(const site of PAD_SITES){
        const dx=Math.max(0,Math.abs(p.x-site.x)-2);
        const dz=Math.max(0,Math.abs(p.z-site.z)-2);
        expect(Math.hypot(dx,dz)).toBeGreaterThanOrEqual(cfg.padGap+p.radius-1e-4);
      }
      const cx=Math.max(0,Math.abs(p.x-31)-3.5);
      const cz=Math.max(0,Math.abs(p.z-2)-3.5);
      expect(Math.hypot(cx,cz)).toBeGreaterThanOrEqual(cfg.coreGap+p.radius-1e-4);
      expect(Math.hypot(p.x+34,p.z+5)).toBeGreaterThanOrEqual(cfg.entryGap+p.radius-1e-4);
    }
  });

  it("reserves the whole northern river + riverbank shoulder for scenery exclusion",()=>{
    for(const p of scene.placements){
      const cfg=SCENERY_SPEC[p.kind];
      if(p.x>=-35&&p.x<=35){
        expect(Math.abs(p.z-riverCenterZ(p.x))-riverOuterBankWidth(p.x))
          .toBeGreaterThanOrEqual(cfg.riverGap+p.radius-1e-4);
      }
    }
  });

  it("enforces within-kind Poisson minimum distance and nonintersecting solid props",()=>{
    for(const kind of PROP_KINDS){
      const points=scene.placements.filter(p=>p.kind===kind);
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
        const a=points[i]!,b=points[j]!;
        expect(Math.hypot(a.x-b.x,a.z-b.z))
          .toBeGreaterThanOrEqual(SCENERY_SPEC[kind].spacing-0.0001);
      }
    }
    const solid=scene.placements.filter(p=>p.kind==="pine"||p.kind==="broadleaf"||p.kind==="rock");
    for(let i=0;i<solid.length;i++)for(let j=i+1;j<solid.length;j++){
      const a=solid[i]!,b=solid[j]!;
      expect(Math.hypot(a.x-b.x,a.z-b.z)).toBeGreaterThanOrEqual(a.radius+b.radius+0.279);
    }
  });

  it("anchors every placement to global seeded terrain, not flat generic y=0",()=>{
    for(const p of scene.placements){
      expect(p.y).toBe(terrainHeight(seed,p.x,p.z));
      expect(Number.isFinite(p.rotation)).toBe(true);
      expect(p.rotation).toBeGreaterThanOrEqual(0);
      expect(p.rotation).toBeLessThan(2*Math.PI);
      expect(p.scale).toBeGreaterThan(0.5);
    }
  });

  it("uses exactly five shared GPU meshes and instance transforms per seed",()=>{
    for(const batch of scene.batches){
      expect(batch.instances).toHaveLength(batch.count);
      expect(batch.meshId).toBe("scenery-"+batch.kind);
      expect(batch.mesh).toBe(getPropMesh(batch.kind));
      expect(new Set(batch.instances.map(i=>i.meshId))).toEqual(new Set([batch.meshId]));
      expect(batch.instances[0]?.model).toHaveLength(16);
    }
  });

  it("caches a seed; another seed moves props but never alters authored gameplay",()=>{
    expect(generateScenery(seed)).toBe(scene);
    const alt=generateScenery("fenwall-crossing-v2");
    expect(alt.seed).not.toBe(scene.seed);
    expect(alt.counts).toEqual(scene.counts);
    expect(alt.placements.slice(0,5).map(x=>[x.x,x.z]))
      .not.toEqual(scene.placements.slice(0,5).map(x=>[x.x,x.z]));
    expect(alt.batches.map(b=>b.mesh)).toEqual(scene.batches.map(b=>b.mesh));
    expect(generateScenery(seed)).toBe(scene);
  });

  it("rejects invalid coordinates/scales/seeds and never calls Math.random",()=>{
    expect(()=>sceneryClearance(NaN,0,"pine")).toThrow(RangeError);
    expect(()=>sceneryClearance(0,Infinity,"pine")).toThrow(RangeError);
    expect(()=>sceneryClearance(0,0,"grass",0)).toThrow(RangeError);
    expect(()=>generateScenery(1.2)).toThrow(RangeError);
    expect(sceneryClearance(0,0,"pine")).toBe(false);
  });
});
