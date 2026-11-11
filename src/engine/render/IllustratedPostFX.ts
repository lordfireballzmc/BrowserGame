/**
 * VQ.03a — restrained real HDR finish for the *single* physical Three scene.
 *
 * Bloom is luminance-gated by explicitly emissive combat bolts and impacts.
 * We never bloom a blurred duplicate of the entire landscape. Half-float
 * intermediate buffers preserve HDR glints before OutputPass tone mapping.
 * There is no new WebGL context, framebuffer readback or gameplay state.
 */
import {
  HalfFloatType, MeshStandardMaterial, Vector2, WebGLRenderTarget,
  type Camera, type Scene, type WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import type {ResolutionPreset} from "./CanvasRuntime";

export type PostFXMode = "off" | "illustrated-bloom";
export const ILLUSTRATED_FX={
  threshold:1.35,
  radius:0.28,
  balancedStrength:0.30,
  sharpStrength:0.43,
  /** Main HDR buffers are fullscreen; never allocate them for 4MP gameplay. */
  maxPixels:2_400_000,
} as const;

/** Keep budget predictable and preserve an unfiltered true-MSAA fallback. */
export function selectIllustratedFX(
  tier:ResolutionPreset,pixels:number,hdrAvailable:boolean,requested=true,
):PostFXMode {
  if(!Number.isSafeInteger(pixels)||pixels<1)
    throw new RangeError("Postprocessing requires positive physical pixel count");
  if(!["economy","balanced","sharp"].includes(tier))
    throw new RangeError("Unknown postprocessing quality tier");
  return !requested||!hdrAvailable||tier==="economy"||
    pixels>ILLUSTRATED_FX.maxPixels?"off":"illustrated-bloom";
}

/**
 * Source mesh IDs, not scene-wide highlights, are the only emissive sources.
 * A threshold above normal white prevents meadow, pads and roofs blooming.
 */
export function setCombatEmissive(
  material:MeshStandardMaterial,meshId:string,
):boolean {
  if(meshId==="warden-physical-bolt"){
    material.emissive.set("#ffaf55");
    material.emissiveIntensity=2.65;
    return true;
  }
  if(meshId==="warden-bolt-hit-glint"){
    material.emissive.set("#fff0b0");
    material.emissiveIntensity=4.0;
    return true;
  }
  return false;
}

export class IllustratedPostFX {
  private composer:EffectComposer|null=null;
  private bloom:UnrealBloomPass|null=null;
  private selected:ResolutionPreset="economy";
  private enabled=true;
  private disposed=false;
  private current:PostFXMode="off";
  constructor(private readonly gpu:WebGLRenderer,
    private readonly scene:Scene,private readonly camera:Camera) {}

  get mode():PostFXMode {return this.current;}
  get qualityTier():ResolutionPreset{return this.selected;}
  get active():boolean{return this.current==="illustrated-bloom";}

  configure(tier:ResolutionPreset,requested=true):PostFXMode {
    if(this.disposed)throw new Error("Postprocessing has been disposed");
    const size=this.gpu.getDrawingBufferSize(new Vector2());
    const hdrAvailable=!!this.gpu.getContext().getExtension("EXT_color_buffer_float");
    const next=selectIllustratedFX(tier,size.x*size.y,hdrAvailable,requested);
    this.selected=tier;
    this.enabled=requested;
    if(next==="off"){
      this.release();
      return this.current;
    }
    if(!this.composer){
      // Pixel ratio is already applied once to the physical backbuffer.
      const target=new WebGLRenderTarget(size.x,size.y,{
        type:HalfFloatType,depthBuffer:true,stencilBuffer:false,
        samples:4,
      });
      const composer=new EffectComposer(this.gpu,target);
      composer.setPixelRatio(1);
      composer.addPass(new RenderPass(this.scene,this.camera));
      const bloom=new UnrealBloomPass(new Vector2(size.x,size.y),
        ILLUSTRATED_FX.balancedStrength,
        ILLUSTRATED_FX.radius,ILLUSTRATED_FX.threshold);
      composer.addPass(bloom);
      // OutputPass is REQUIRED for color-space conversion and tone mapping.
      composer.addPass(new OutputPass());
      this.composer=composer;
      this.bloom=bloom;
    }
    this.composer.setSize(size.x,size.y);
    this.bloom!.strength=tier==="sharp"
      ?ILLUSTRATED_FX.sharpStrength:ILLUSTRATED_FX.balancedStrength;
    this.current=next;
    return next;
  }

  /** Recompute target allocation after physical canvas DPR/quality resizing. */
  resize():void {
    if(this.disposed)return;
    this.configure(this.selected,this.enabled);
  }

  render():void {
    if(this.current==="illustrated-bloom"&&this.composer)
      this.composer.render(0);
    else this.gpu.render(this.scene,this.camera);
  }

  private release():void {
    this.composer?.dispose();
    this.composer=null;
    this.bloom=null;
    this.current="off";
  }
  dispose():void {
    if(this.disposed)return;
    this.disposed=true;
    this.release();
  }
}
