import {describe,it,expect} from "vitest";
import {MeshStandardMaterial} from "three";
import {
  ILLUSTRATED_FX,selectIllustratedFX,setCombatEmissive,
} from "../src/engine/render/IllustratedPostFX";
import {
  WIND_BEND_FRACTION,windVertexShader,installFoliageWind,advanceFoliageWind,
} from "../src/engine/render/IllustratedWind";

describe("VQ.03a deliberately restrained HDR illustration bloom",()=>{
  it("respects physical pixels, GPU HDR extension, user off switch and economy fallback",()=>{
    expect(selectIllustratedFX("economy",100_000,true)).toBe("off");
    expect(selectIllustratedFX("balanced",810_000,true)).toBe("illustrated-bloom");
    expect(selectIllustratedFX("sharp",2_400_000,true)).toBe("illustrated-bloom");
    expect(selectIllustratedFX("sharp",2_400_001,true)).toBe("off");
    expect(selectIllustratedFX("balanced",1_000_000,false)).toBe("off");
    expect(selectIllustratedFX("sharp",1_000_000,true,false)).toBe("off");
    expect(()=>selectIllustratedFX("sharp",0,true)).toThrow(RangeError);
    expect(()=>selectIllustratedFX("ultra" as "sharp",1,true)).toThrow(RangeError);
    expect(ILLUSTRATED_FX.threshold).toBeGreaterThan(1);
    expect(ILLUSTRATED_FX.sharpStrength).toBeLessThan(0.5);
    expect(ILLUSTRATED_FX.radius).toBeLessThan(0.4);
  });
  it("only physically present projectiles and hit glints gain emissive HDR energy",()=>{
    for(const [id,intensity] of [
      ["warden-physical-bolt",2.65],["warden-bolt-hit-glint",4],
    ] as const){
      const m=new MeshStandardMaterial();
      expect(setCombatEmissive(m,id)).toBe(true);
      expect(m.emissiveIntensity).toBe(intensity);
      expect(m.emissive.r+m.emissive.g+m.emissive.b).toBeGreaterThan(0);
      m.dispose();
    }
    for(const id of ["island-static-ground","authored-road","staged-core",
      "scenery-pine","carved-pad","copper-crown-pickup"]){
      const m=new MeshStandardMaterial();
      expect(setCombatEmissive(m,id)).toBe(false);
      expect(m.emissive.getHex()).toBe(0);
      m.dispose();
    }
  });
});

describe("VQ.04b actual authored groundcover vertex animation",()=>{
  it("deforms only non-root vertices with stable instanced spatial gust phase",()=>{
    const original="#include <common>\nvoid main(){\n#include <begin_vertex>\n}";
    const shader=windVertexShader(original,-0.04,1.1);
    expect(shader).toContain("uniform float uFenwallWindSeconds;");
    expect(shader).toContain("fenStem");
    expect(shader).toContain("smoothstep(0.18,0.95,fenStem)");
    expect(shader).toContain("fenRoot*fenRoot");
    expect(shader).toContain("instanceMatrix[3].xz");
    expect(shader).toContain("#ifdef USE_INSTANCING");
    expect(shader).toContain("transformed.x+=fenBend");
    expect(shader).toContain("transformed.z+=fenBend");
    expect(shader).toContain("1.140000");
    expect(shader).toContain("position.y-(-0.040000)");
    expect(shader).not.toContain("position.y--");
    const positive=windVertexShader(original,0.02,1);
    expect(positive).toContain("position.y-(0.020000)");
    expect(shader).not.toBe(original);
    expect(WIND_BEND_FRACTION).toBeLessThan(0.12);
    expect(()=>windVertexShader("broken",0,1)).toThrow();
    expect(()=>windVertexShader(original,1,1)).toThrow(RangeError);
    expect(()=>windVertexShader(original,NaN,1)).toThrow(RangeError);
  });
  it("updates a reusable GPU uniform without CPU vertex rebuilds or wall time",()=>{
    const mat=new MeshStandardMaterial();
    const uniform=installFoliageWind(mat,0,2);
    const program=mat.customProgramCacheKey();
    expect(program).toContain("bastionfall-foliage-wind-v2|0.000000|2.000000");
    const clocks=[uniform,{value:0}];
    advanceFoliageWind(clocks,0.25);
    expect(clocks.map(c=>c.value)).toEqual([0.25,0.25]);
    advanceFoliageWind(clocks,0);
    expect(clocks.map(c=>c.value)).toEqual([0,0]);
    expect(()=>advanceFoliageWind(clocks,-1)).toThrow(RangeError);
    expect(()=>advanceFoliageWind(clocks,Infinity)).toThrow(RangeError);
    expect(()=>installFoliageWind(new MeshStandardMaterial(),0,0)).toThrow(RangeError);
    mat.dispose();
  });
});
