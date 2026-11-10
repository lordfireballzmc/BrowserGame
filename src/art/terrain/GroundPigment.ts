/**
 * VQ.02c — world-space illustrated grass pigments for the *actual* static
 * island vertex colors. These are not triangles of randomly colored turf:
 * the same coordinates receive the same blended linear-light pigment across
 * tile edges, so the whole island reads as broad painterly meadow swathes.
 *
 * Uses existing F2.01 1m triangulation: no terrain duplication, new textures,
 * extra transparent layers or full-screen shader pass. The game's relief,
 * road collisions and all position/navigation logic are untouched.
 */
import { seedToUint32 } from "../../game/Random";
import { nearestRoadPoint, ROAD_SPEC } from "./RoadPath";
import { linearColor, type LinearRgb } from "../../engine/render/Palette";

const grass = linearColor("grass.primary");
const shadow = linearColor("grass.shadow");
const ochre = linearColor("grass.dry");
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};

function pointHash(seed:number,x:number,z:number):number {
  let h=seed^Math.imul(x,0x27d4eb2d)^Math.imul(z,0x165667b1);
  h=Math.imul(h^(h>>>15),0x2c1b3c6d);
  h=Math.imul(h^(h>>>12),0x297a2d39);
  return ((h^(h>>>15))>>>0)/0xffffffff;
}
function noise(seed:number,x:number,z:number,size:number):number {
  const xx=x/size, zz=z/size, gx=Math.floor(xx),gz=Math.floor(zz);
  const tx=smooth(xx-gx),tz=smooth(zz-gz);
  const a=pointHash(seed,gx,gz)*(1-tx)+pointHash(seed,gx+1,gz)*tx;
  const b=pointHash(seed,gx,gz+1)*(1-tx)+pointHash(seed,gx+1,gz+1)*tx;
  return a*(1-tz)+b*tz;
}
const mix=(a:LinearRgb,b:LinearRgb,t:number):LinearRgb=>
  [a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t];

/**
 * Returns **linear-light RGB** suitable for Three.js vertexColors, not sRGB.
 * World coordinate sampling means adjacent terrain tiles agree exactly.
 */
export function groundPigmentAt(
  seed:number|string,x:number,z:number,
):LinearRgb {
  if(!Number.isFinite(x)||!Number.isFinite(z))
    throw new RangeError("Ground pigment requires finite world coordinates");
  const s=seedToUint32(seed);
  const broad=noise(s^0x9a6b5231,x,z,16);
  const fleck=noise(s^0xa2cd1e5b,x,z,5.3);
  const small=noise(s^0x716e9f31,x,z,2.2);
  // Broad woodland moss shadows surrounded by warm open golden meadows.
  // Coherent patches grow gradually; a triangle cannot switch to a flat
  // incompatible palette token in the middle of a land texture.
  const shade=0.12+0.43*smooth((0.61-broad)*1.45)
    +0.13*smooth((0.48-fleck)*1.30);
  const sun=0.11+0.26*smooth((broad-0.36)*1.90)
    +0.10*smooth((small-0.38)*1.25);
  const roadside=nearestRoadPoint(x,z).lateralDistance-ROAD_SPEC.halfWidthMeters;
  // A quiet dry golden verge, not a beige strip with hard stepped borders.
  // The road itself is drawn above this mesh; art should not occlude it.
  const verge=smooth((roadside+0.25)/1.15)
    *(1-smooth((roadside-0.8)/3.7));
  const pigment=mix(mix(grass,shadow,clamp(shade*0.65)),
    ochre,clamp(sun*0.39+verge*0.40));
  // Tiny luminous variation retains low-contrast texture at mobile zoom
  // without relying on grain shaders or excessive neon saturation.
  const bloom=0.94+0.12*(small-0.5);
  return [pigment[0]*bloom,pigment[1]*bloom,pigment[2]*bloom];
}
