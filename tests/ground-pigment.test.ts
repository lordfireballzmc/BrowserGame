import {describe,expect,it} from "vitest";
import {generateTerrain} from "../src/art/terrain/Island";
import {groundPigmentAt} from "../src/art/terrain/GroundPigment";
import {toThreeGeometry} from "../src/engine/render/UnifiedThreeRenderer";
import {mergeStaticGeometries} from "../src/art/mesh/StaticBatch";
import {linearColor} from "../src/engine/render/Palette";

const seed="fenwall-crossing-v1";
describe("VQ.02c globally continuous painterly Three meadow",()=>{
  it("samples deterministic seed-based warm/woodland pigment rather than a uniform flat field",()=>{
    const a=groundPigmentAt(seed,3.25,11.45);
    expect(groundPigmentAt(seed,3.25,11.45)).toEqual(a);
    expect(groundPigmentAt("another-seed",3.25,11.45)).not.toEqual(a);
    expect(groundPigmentAt(seed,3.25,11.45)).not.toEqual(groundPigmentAt(seed,22.2,15.95));
    expect(a).not.toEqual(linearColor("grass.primary"));
    expect(a.every(n=>Number.isFinite(n)&&n>=0&&n<=1)).toBe(true);
    expect(()=>groundPigmentAt(seed,NaN,5)).toThrow(/finite/);
    expect(()=>groundPigmentAt(seed,5,Infinity)).toThrow(/finite/);
  });
  it("is sampled by absolute world coordinates, so shared terrain tile edges cannot change color",()=>{
    for(const [x,z] of [[0,0],[8,8],[-8,-16],[32,12]]){
      const same=groundPigmentAt(seed,x,z);
      expect(groundPigmentAt(seed,x,z)).toEqual(same);
      const next=groundPigmentAt(seed,x+0.08,z+0.07);
      expect(Math.max(...same.map((c,i)=>Math.abs(c-next[i]!)))).toBeLessThan(0.025);
    }
  });
  it("paints the actual existing ground BufferGeometry without touching position, index or normals",()=>{
    const island=generateTerrain(seed);
    const source=mergeStaticGeometries(island.tiles.map(t=>t.surface));
    const standard=toThreeGeometry(source,"grass.primary");
    const painted=toThreeGeometry(source,"grass.primary",seed);
    expect(painted.getAttribute("position").count).toBe(standard.getAttribute("position").count);
    expect(painted.getAttribute("normal").array).toEqual(standard.getAttribute("normal").array);
    expect(painted.index?.array).toEqual(standard.index?.array);
    const positions=painted.getAttribute("position"),colors=painted.getAttribute("color");
    const legacy=standard.getAttribute("color");
    let varied=0;
    for(let i=0;i<positions.count;i+=13){
      const expected=groundPigmentAt(seed,positions.getX(i),positions.getZ(i));
      expect(colors.getX(i)).toBeCloseTo(expected[0],6);
      expect(colors.getY(i)).toBeCloseTo(expected[1],6);
      expect(colors.getZ(i)).toBeCloseTo(expected[2],6);
      if(Math.abs(colors.getX(i)-legacy.getX(i))>1e-4)varied++;
    }
    expect(varied).toBeGreaterThan(100);
    painted.dispose();standard.dispose();
  });
});
