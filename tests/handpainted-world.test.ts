import {describe,it,expect} from "vitest";
import {generateScenery} from "../src/art/scenery/Scenery";
import {generateTerrain} from "../src/art/terrain/Island";
import {mergeStaticGeometries} from "../src/art/mesh/StaticBatch";
import {toThreeGeometry} from "../src/engine/render/UnifiedThreeRenderer";
import {
  PAINTERLY_SURFACE,paintedFamilyForMesh,brushCount,
  planPaintMarks,worldPaintUV,
} from "../src/engine/render/HandpaintedSurfaces";
import {
  PAINTERLY_TREE_BUDGET,makeBrushCanopyGeometry,
  makeGnarledWoodGeometry,planPainterlyTrees,
} from "../src/art/models/HandpaintedForest";

describe("ART.LOCK.01 actual Three painterly-world, not art mockup",()=>{
  it("has a stable palette-specific brush layout with jagged oriented pigment strokes",()=>{
    const road=planPaintMarks("road");
    const bark=planPaintMarks("bark");
    const leaf=planPaintMarks("foliage");
    expect(road).toHaveLength(brushCount("road"));
    expect(brushCount("road")).toBeLessThan(brushCount("meadow"));
    expect(brushCount("foliage")).toBeGreaterThan(brushCount("road"));
    expect(road).toEqual(planPaintMarks("road"));
    expect(road).not.toEqual(planPaintMarks("river"));
    expect(bark).not.toEqual(leaf);
    for(const m of [...road,...bark,...leaf]){
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThan(1);
      expect(m.y).toBeGreaterThanOrEqual(0);
      expect(m.y).toBeLessThan(1);
      expect(m.length).toBeGreaterThan(0);
      expect(m.width).toBeGreaterThan(0);
      expect(m.opacity).toBeGreaterThan(0);
      expect(m.opacity).toBeLessThan(1);
      expect(Object.isFrozen(m)).toBe(true);
    }
    expect(()=>planPaintMarks("gloss" as "road")).toThrow(RangeError);
    expect(()=>planPaintMarks("road",NaN)).toThrow(RangeError);
  });
  it("maps ONLY actual 3D landscape meshes and keeps world-meter UV alignment",()=>{
    expect(paintedFamilyForMesh("island-static-ground")).toBe("meadow");
    expect(paintedFamilyForMesh("authored-road")).toBe("road");
    expect(paintedFamilyForMesh("island-static-cliffs")).toBe("stone");
    expect(paintedFamilyForMesh("north-river-water")).toBe("river");
    expect(paintedFamilyForMesh("river-timber-bridge")).toBe("timber");
    expect(paintedFamilyForMesh("staged-warden")).toBeNull();
    const p=new Float32Array([0,1,0,9,1,9,-9,2,-9]);
    const a=worldPaintUV(p,"meadow");
    expect([...a]).toEqual([0,0,1,1,-1,-1]);
    const b=worldPaintUV(p,"road");
    expect(b[2]).toBeGreaterThan(0);
    expect([...b].every(Number.isFinite)).toBe(true);
    // The bend-following map deliberately differs from linear world XY UV.
    expect([...b]).not.toEqual([...worldPaintUV(p,"meadow")]);
    expect(()=>worldPaintUV(new Float32Array([0,1]),"meadow")).toThrow();
    expect(()=>worldPaintUV(new Float32Array([NaN,1,0]),"meadow")).toThrow();
  });
  it("preserves original terrain shape, normal, index and color while adding paint UV",()=>{
    const source=mergeStaticGeometries(
      generateTerrain("fenwall-crossing-v1").tiles.map(x=>x.surface));
    const old=toThreeGeometry(source,"grass.primary","fenwall-crossing-v1");
    const painted=toThreeGeometry(source,"grass.primary","fenwall-crossing-v1","meadow");
    expect(old.getAttribute("uv")).toBeUndefined();
    expect(painted.getAttribute("uv").count).toBe(
      painted.getAttribute("position").count);
    expect(painted.index?.array).toEqual(old.index?.array);
    expect(painted.getAttribute("position").array).toEqual(old.getAttribute("position").array);
    expect(painted.getAttribute("normal").array).toEqual(old.getAttribute("normal").array);
    expect(painted.getAttribute("color").array).toEqual(old.getAttribute("color").array);
    const uv=painted.getAttribute("uv");
    const p=painted.getAttribute("position");
    for(let i=0;i<p.count;i+=53){
      expect(uv.getX(i)).toBeCloseTo(p.getX(i)/PAINTERLY_SURFACE.worldRepeatMeters,5);
      expect(uv.getY(i)).toBeCloseTo(p.getZ(i)/PAINTERLY_SURFACE.worldRepeatMeters,5);
    }
    old.dispose();painted.dispose();
  });
  it("replaces exactly the 40 real tree placements, leaves gameplay untouched",()=>{
    const scenery=generateScenery("fenwall-crossing-v1");
    const trees=planPainterlyTrees(scenery.placements);
    expect(trees).toHaveLength(PAINTERLY_TREE_BUDGET.treeCount);
    expect(trees.filter(t=>t.kind==="pine")).toHaveLength(24);
    expect(trees.filter(t=>t.kind==="broadleaf")).toHaveLength(16);
    for(const t of trees){
      const original=scenery.placements.find(p=>p.id===t.id)!;
      expect(original.x).toBe(t.x);
      expect(original.z).toBe(t.z);
      expect(original.y).toBe(t.y);
      expect(t.size).toBeGreaterThan(0);
      expect(Object.isFrozen(t)).toBe(true);
    }
    expect(planPainterlyTrees(scenery.placements)).toEqual(trees);
    expect(()=>planPainterlyTrees(scenery.placements.slice(1))).toThrow(RangeError);
  });
  it("actually sculpts twisted trunk and sharp painterly canopy meshes",()=>{
    const trunk=makeGnarledWoodGeometry();
    const fork=makeGnarledWoodGeometry(true);
    const crown=makeBrushCanopyGeometry();
    for(const g of [trunk,fork,crown]){
      expect(g.index?.count).toBeGreaterThan(80);
      for(const k of ["position","normal","color","uv"]){
        expect(g.getAttribute(k).count).toBe(g.getAttribute("position").count);
      }
      g.computeBoundingBox();
      expect(g.boundingBox!.max.y).toBeGreaterThan(0.6);
      expect(g.boundingBox!.max.x-g.boundingBox!.min.x).toBeGreaterThan(0.2);
    }
    // The canopy is physically WIDE and shallow, deliberately not a cone.
    expect(crown.boundingBox!.max.x-crown.boundingBox!.min.x)
      .toBeGreaterThan(2.5);
    expect(crown.boundingBox!.max.y-crown.boundingBox!.min.y)
      .toBeLessThan(1.4);
    expect(PAINTERLY_TREE_BUDGET.branches).toBe(80);
    expect(PAINTERLY_TREE_BUDGET.shrubCanopyLayers).toBe(144);
    expect(PAINTERLY_TREE_BUDGET.batches).toBe(3);
    trunk.dispose();fork.dispose();crown.dispose();
  });
});
