/**
 * ART.LOCK.01 — original, deterministic hand-painted pigment surfaces for the
 * ACTUAL Three.js game. Not a fixed concept illustration, WebGL overlay, color
 * LUT, filter, or a second canvas rendering context.
 *
 * A small repeatable gouache texture is physically brushed ONCE into an
 * offscreen HTML canvas at setup. The original road/ground/water/stone vertices
 * receive WORLD-METER UVs and keep their true terrain geometry and gameplay
 * collider. All brush marks are deterministic; the texture is not reallocated
 * per frame. Textures are variations around the real material's vertex colors.
 */
import {CanvasTexture,RepeatWrapping,SRGBColorSpace} from "three";
export type PaintedSurfaceKind="meadow"|"road"|"river"|"stone"|"timber"|"foliage"|"bark";
type Marks={x:number;y:number;length:number;width:number;tilt:number;tone:number;opacity:number};
export const PAINTERLY_SURFACE={
  textureSize:512,worldRepeatMeters:9,
  brushCount:420,brushSeed:0x7154cafa,
} as const;

const samplePalette:Record<PaintedSurfaceKind,readonly string[]>={
  meadow:["#b4bd78","#9da96e","#b8ae65","#768f60","#d5c487"],
  road:["#e4c58d","#f5dcad","#cba16b","#ad875e","#e8bb79"],
  river:["#b3d5cc","#89b9bd","#d9eee2","#629d9e","#9dc9c7"],
  stone:["#c6c9bb","#899892","#ded4ba","#737f7a","#b7ae96"],
  timber:["#cfaa7d","#e6c69b","#99744f","#6f4e39","#ba865a"],
  foliage:["#9eaa49","#c1b756","#d6cc6c","#667a42","#8f9841"],
  bark:["#ad7d51","#d2a16c","#87573b","#633e2d","#bf8954"],
};
const base:Record<PaintedSurfaceKind,string>={
  meadow:"#bdc081",road:"#edd19d",river:"#c3ddd5",
  stone:"#d4d1bd",timber:"#d5ae83",foliage:"#acb651",bark:"#b88758",
};
const fract=(x:number)=>x-Math.floor(x);
/** Integer PRNG avoids Math.random and produces same stroke family on reload. */
function generator(seed:number):()=>number {
  let v=seed>>>0;
  return ()=>{
    v^=v<<13;v^=v>>>17;v^=v<<5;
    return (v>>>0)/0x100000000;
  };
}
const kinds:readonly PaintedSurfaceKind[]=[
  "meadow","road","river","stone","timber","foliage","bark",
];
export function isPaintedSurfaceKind(input:string):input is PaintedSurfaceKind {
  return kinds.includes(input as PaintedSurfaceKind);
}
/**
 * Return stable brush strokes WITHOUT the DOM; pure and unit-testable.
 * Variable widths, broken angular ends and directionality mimic handmade
 * opaque paint; don't confuse this procedural first pass with finished
 * artist-approved painted textures.
 */
export function planPaintMarks(kind:PaintedSurfaceKind,seed=PAINTERLY_SURFACE.brushSeed):readonly Marks[] {
  if(!isPaintedSurfaceKind(kind)||!Number.isSafeInteger(seed))
    throw new RangeError("Unknown hand-painted material or invalid paint seed");
  const local=seed^((kinds.indexOf(kind)+1)*0x9e3779b9);
  const rand=generator(local);
  const strokes:Marks[]=[];
  for(let i=0;i<PAINTERLY_SURFACE.brushCount;i++){
    const x=rand(),y=rand();
    const scale=kind==="foliage"?0.052:kind==="bark"?0.036
      :kind==="river"?0.10:kind==="road"?0.12:0.083;
    const dir=kind==="bark"?Math.PI*0.5:kind==="river"?0.08
      :kind==="road"?0.38:kind==="foliage"?-0.35:0.13;
    strokes.push(Object.freeze({
      x,y,length:scale*(0.42+rand()*1.40),
      width:scale*(0.075+rand()*0.17),
      tilt:dir+(rand()-0.5)*(kind==="bark"?0.28:1.2),
      tone:Math.floor(rand()*samplePalette[kind].length),
      opacity:0.16+0.44*rand(),
    }));
  }
  return Object.freeze(strokes);
}
function polygonStroke(ctx:CanvasRenderingContext2D,m:Marks,kind:PaintedSurfaceKind):void {
  const size=PAINTERLY_SURFACE.textureSize;
  const x=m.x*size,y=m.y*size,dx=Math.cos(m.tilt)*m.length*size;
  const dy=Math.sin(m.tilt)*m.length*size,w=m.width*size;
  // Offset chisel-end and frayed taper; no circular airbrush dots.
  ctx.globalAlpha=m.opacity;
  ctx.fillStyle=samplePalette[kind][m.tone]!;
  const normalX=-Math.sin(m.tilt),normalY=Math.cos(m.tilt);
  ctx.beginPath();
  ctx.moveTo(x+normalX*w*0.5,y+normalY*w*0.5);
  ctx.lineTo(x+dx*0.72+normalX*w*0.36,y+dy*0.72+normalY*w*0.36);
  ctx.lineTo(x+dx+normalX*w*0.06,y+dy+normalY*w*0.06);
  ctx.lineTo(x+dx*0.80-normalX*w*0.27,y+dy*0.80-normalY*w*0.27);
  ctx.lineTo(x-normalX*w*0.52,y-normalY*w*0.52);
  ctx.closePath();ctx.fill();
  // A few short dry-brush fibers brighten stroke ridges. Low overhead because
  // these are authored into ONE 512px texture, not animated each frame.
  if(m.tone%3===1){
    ctx.globalAlpha=m.opacity*0.48;
    ctx.strokeStyle="#f4eac3";ctx.lineWidth=Math.max(0.55,w*0.12);
    ctx.beginPath();
    ctx.moveTo(x+normalX*w*0.18,y+normalY*w*0.18);
    ctx.lineTo(x+dx*0.63+normalX*w*0.15,y+dy*0.63+normalY*w*0.15);
    ctx.stroke();
  }
}
export function makePainterlyTexture(kind:PaintedSurfaceKind):CanvasTexture {
  if(!isPaintedSurfaceKind(kind))throw new RangeError("Invalid painted family");
  const c=document.createElement("canvas");
  c.width=c.height=PAINTERLY_SURFACE.textureSize;
  const ctx=c.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("Canvas 2D required only during texture baking");
  ctx.fillStyle=base[kind];ctx.fillRect(0,0,c.width,c.height);
  for(const mark of planPaintMarks(kind))polygonStroke(ctx,mark,kind);
  ctx.globalAlpha=1;
  const tex=new CanvasTexture(c);
  tex.name="Bastionfall-ARTLOCK-painted-"+kind;
  tex.wrapS=tex.wrapT=RepeatWrapping;
  tex.colorSpace=SRGBColorSpace;
  tex.anisotropy=4;
  tex.needsUpdate=true;
  return tex;
}

/** Which real world meshes get 3D-space painted surfaces, NOT a global overlay. */
export function paintedFamilyForMesh(meshId:string):PaintedSurfaceKind|null {
  switch(meshId){
    case "island-static-ground":return "meadow";
    case "authored-road":return "road";
    case "island-static-cliffs":case "north-river-banks":return "stone";
    case "north-river-water":return "river";
    case "river-timber-bridge":return "timber";
    default:return null;
  }
}
/** World-meter UVs preserve continuity across all 54 ground tiles. */
export function worldPaintUV(
  sourcePositions:Float32Array,kind:PaintedSurfaceKind,
):Float32Array {
  if(sourcePositions.length%3!==0)
    throw new RangeError("Hand-painted UVs need xyz vertices");
  const out=new Float32Array(sourcePositions.length/3*2);
  const meter=kind==="road"?6.5:kind==="river"?10:PAINTERLY_SURFACE.worldRepeatMeters;
  for(let i=0;i<sourcePositions.length/3;i++){
    const x=sourcePositions[i*3]!,y=sourcePositions[i*3+1]!,
      z=sourcePositions[i*3+2]!;
    if(![x,y,z].every(Number.isFinite))throw new RangeError("Nonfinite painted UV");
    out[i*2]=x/meter;
    out[i*2+1]=kind==="stone"?(y+z*0.72)/meter:z/meter;
  }
  return out;
}
