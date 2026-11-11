/**
 * VQ.04b — inexpensive time-sampled vertex wind for real authored grass and
 * flower GLBs. Stable 3D InstancedMesh GPU work, no vertex CPU allocations,
 * no second renderer, no fake collision. Only no-shadow batches use this
 * deformation, so sun-shadow maps cannot mismatch moving foliage.
 */
import type {MeshStandardMaterial} from "three";

export interface WindClock {value:number}
export const WIND_BEND_FRACTION=0.105;

/** A pure shader transform, with the lower ~25% firmly rooted. */
export function windVertexShader(source:string,minY:number,maxY:number):string {
  if(![minY,maxY].every(Number.isFinite)||maxY-minY<=1e-4)
    throw new RangeError("Animated foliage needs a real nonzero 3D height");
  const common="#include <common>", start="#include <begin_vertex>";
  if(!source.includes(common)||!source.includes(start))
    throw new Error("Three foliage vertex shader chunks changed");
  const minimum=minY.toFixed(6);
  const extent=(maxY-minY).toFixed(6);
  return source.replace(common,common+
    "\nuniform float uFenwallWindSeconds;")
    .replace(start,`${start}
    #ifdef USE_INSTANCING
      // Same shader for every copy; instance positions decorrelate gusts.
      float fenStem=clamp((position.y-(${minimum}))/${extent},0.0,1.0);
      float fenRoot=smoothstep(0.18,0.95,fenStem);
      float fenBend=fenRoot*fenRoot;
      vec2 fenSite=instanceMatrix[3].xz;
      float fenPhase=fenSite.x*0.37+fenSite.y*0.51;
      float fenGust=0.71*sin(uFenwallWindSeconds*1.55+fenPhase)
        +0.29*sin(uFenwallWindSeconds*2.37+fenPhase*1.91);
      transformed.x+=fenBend*${extent}*${WIND_BEND_FRACTION.toFixed(3)}*fenGust;
      transformed.z+=fenBend*${extent}*0.052*
        sin(uFenwallWindSeconds*1.24+fenPhase*1.61);
    #endif
  `);
}

/** Each independently cloned GLB material receives one live float uniform. */
export function installFoliageWind(
  material:MeshStandardMaterial,minY:number,maxY:number,
):WindClock {
  // Validate the source geometry and generator at installation, not mid-draw.
  windVertexShader("#include <common>\n#include <begin_vertex>",minY,maxY);
  const clock:WindClock={value:0};
  const originalCompile=material.onBeforeCompile.bind(material);
  const originalKey=material.customProgramCacheKey.bind(material);
  material.onBeforeCompile=(shader,renderer)=>{
    originalCompile(shader,renderer);
    shader.uniforms.uFenwallWindSeconds=clock;
    shader.vertexShader=windVertexShader(shader.vertexShader,minY,maxY);
  };
  material.customProgramCacheKey=()=>originalKey()+"|bastionfall-foliage-wind-v2|"+
    minY.toFixed(6)+"|"+maxY.toFixed(6);
  material.needsUpdate=true;
  return clock;
}

export function advanceFoliageWind(clocks:readonly WindClock[],seconds:number):void {
  if(!Number.isFinite(seconds)||seconds<0)
    throw new RangeError("Foliage visual clock must be finite and nonnegative");
  for(const clock of clocks)clock.value=seconds;
}
