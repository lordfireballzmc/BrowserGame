/**
 * ART.02 — single-WebGL2-context Three scene for the actual Fenwall battlefield.
 *
 * This renderer ingests the existing gameplay-independent Geometry / RenderInstance
 * contract, retains authoritative simulation and exactly copies OrthoCamera
 * matrices. All terrain, raiders, hero, shots and the licensed textured GLB share
 * one color, depth and shadow buffer. This is a controlled renderer migration,
 * NOT a replacement for the game's deterministic physics or original artwork.
 */
import {
  AmbientLight, Box3, BufferAttribute, BufferGeometry, Camera, Color,
  DirectionalLight, DynamicDrawUsage, Float32BufferAttribute, Group,
  HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  NeutralToneMapping, PCFSoftShadowMap, PointLight, Scene, SRGBColorSpace,
  Vector2, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { validateGeometry, type Geometry } from "../../art/mesh/Primitives";
import { TERRAIN_ASSETS } from "../../art/assets/AssetManifest";
import { linearColor, vertexMaterialColor, type MaterialToken } from "./Palette";
import { aabbIntersectsFrustum } from "./Frustum";
import { RiggedCharacterLayer, type ActorMotion, type RiggedCharacterStats } from "./RiggedCharacterLayer";
import {
  EnvironmentArtLayer, type EnvironmentArtStatus,
  type EnvironmentPlacement, type EnvironmentPadPlacement,
} from "./EnvironmentArtLayer";
import { SceneryArtLayer, type SceneryArtStats } from "./SceneryArtLayer";
import type { GroundcoverArtStats } from "./GroundcoverArtLayer";
import { groundPigmentAt } from "../../art/terrain/GroundPigment";
import type { SceneryPlacement } from "../../art/scenery/Scenery";
import type { CameraMatrices, RenderInstance, RenderStats } from "./InstancedRenderer";
import type { ResolutionPreset } from "./CanvasRuntime";
import {IllustratedPostFX, setCombatEmissive, type PostFXMode} from "./IllustratedPostFX";
/** Nonvisual provenance and validation returned by the locally loaded GLB. */
export interface ImportedAssetStatus {
  readonly meshCount: number;
  readonly texturedMaterials: number;
  readonly widthMeters: number;
  readonly heightMeters: number;
  readonly sourceId: string;
}

type Submitted = {
  readonly meshId: string;
  readonly material: MaterialToken;
  readonly opacity: number;
  readonly models: ArrayLike<number>[];
};
type MeshPool = {
  mesh: InstancedMesh;
  capacity: number;
  material: MeshStandardMaterial;
};

/** Directly reuse existing validated vertices/normals, preserve authored token ramps. */
export function toThreeGeometry(
  source: Geometry,fallback: MaterialToken,groundSeed?:number|string,
): BufferGeometry {
  validateGeometry(source);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(source.positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(source.normals, 3));
  geometry.setIndex(new BufferAttribute(source.indices, 1));
  const colors = new Float32Array(source.materialIds.length * 3);
  const inherited = linearColor(fallback);
  for (let i = 0; i < source.materialIds.length; i++) {
    const color = groundSeed===undefined
      ? (vertexMaterialColor(source.materialIds[i]!) ?? inherited)
      : groundPigmentAt(groundSeed,source.positions[i*3]!,source.positions[i*3+2]!);
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}
function matrixIsValid(m: ArrayLike<number>): boolean {
  if (m.length !== 16) return false;
  for (let i = 0; i < 16; i++) if (!Number.isFinite(m[i])) return false;
  return true;
}

/**
 * Compat renderer for the same procedural game content and source GLB.
 * A single canvas and WebGL2 context per world; NOT a composited overlay.
 */
export class UnifiedThreeRenderer {
  private readonly gpu: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new Camera();
  private readonly stored = new Map<string, Geometry>();
  private groundPigmentSeed: number|string|undefined;
  private readonly variants = new Map<string, BufferGeometry>();
  private readonly pools = new Map<string, MeshPool>();
  private readonly matrix = new Matrix4();
  private readonly imported = new Group();
  private readonly animatedCharacters = new RiggedCharacterLayer(this.scene);
  private readonly environment = new EnvironmentArtLayer(this.scene);
  private readonly sceneryArt = new SceneryArtLayer(this.scene);
  private readonly illustratedFX: IllustratedPostFX;
  private destroyed = false;
  private useShadows = false;
  private useCulling = false;
  private sourceStatus: ImportedAssetStatus | null = null;
  private bytes = 0;

  constructor(canvas: HTMLCanvasElement, context: WebGL2RenderingContext) {
    this.gpu = new WebGLRenderer({
      canvas, context, antialias: true, preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    // Canvas width/height are PHYSICAL backbuffer pixels. Never multiply DPR
    // again: the page resolves CSS pixels × safe DPR before WebGL creation.
    this.gpu.setPixelRatio(1);
    this.gpu.setSize(canvas.width, canvas.height, false);
    this.gpu.setClearColor(0xd4ded4, 1);
    this.gpu.outputColorSpace = SRGBColorSpace;
    this.gpu.toneMapping = NeutralToneMapping;
    this.gpu.toneMappingExposure = 1.23;
    // Include every composer pass and shadow draw in the reported GPU draw count.
    this.gpu.info.autoReset=false;
    this.illustratedFX=new IllustratedPostFX(this.gpu,this.scene,this.camera);

    this.scene.background = new Color(0xd4ded4);
    this.scene.add(new HemisphereLight(0xcbe5f5, 0x648054, 2.30));
    this.scene.add(new AmbientLight(0xffedce, 0.32));
    const sun = new DirectionalLight(0xffdea8, 2.75);
    sun.position.set(-40, 63, 44);
    sun.target.position.set(5, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 160;
    sun.shadow.camera.left = -65;
    sun.shadow.camera.right = 65;
    sun.shadow.camera.top = 65;
    sun.shadow.camera.bottom = -65;
    sun.shadow.bias = -0.00018;
    sun.shadow.normalBias = 0.022;
    sun.shadow.radius = 2.0;
    this.scene.add(sun, sun.target);

    const glow = new PointLight(0xffae61, 6.5, 4.5, 2);
    glow.position.set(0, 1.7, 0);
    this.imported.add(glow);
    this.scene.add(this.imported);
  }

  enableSunShadows(): void {
    this.assertActive();
    this.useShadows = true;
    this.gpu.shadowMap.enabled = true;
    this.gpu.shadowMap.type = PCFSoftShadowMap;
  }
  enableFrustumCulling(): void {
    this.assertActive();
    this.useCulling = true;
  }
  get sunShadowsEnabled(): boolean { return this.useShadows; }
  get frustumCullingEnabled(): boolean { return this.useCulling; }
  get meshCount(): number { return this.stored.size; }
  get estimatedGpuBytes(): number {
    // Geometry and depth budget only; NOT a driver-verified VRAM measurement.
    return this.bytes + (this.useShadows ? 2048*2048*4 : 0);
  }
  get importedStatus(): ImportedAssetStatus | null { return this.sourceStatus; }
  get riggedStatus(): RiggedCharacterStats | null { return this.animatedCharacters.stats; }
  get riggedCharactersReady(): boolean { return this.animatedCharacters.ready; }
  get environmentStatus(): EnvironmentArtStatus | null { return this.environment.status; }
  get sceneryArtStatus(): SceneryArtStats | null { return this.sceneryArt.stats; }
  get sceneryArtReady(): boolean { return this.sceneryArt.ready; }
  get groundcoverReady():boolean{return this.sceneryArt.groundcoverReady;}
  get postProcessingMode():PostFXMode{return this.illustratedFX.mode;}
  configureIllustratedPostFX(tier:ResolutionPreset,enabled=true):PostFXMode {
    this.assertActive();
    return this.illustratedFX.configure(tier,enabled);
  }
  get groundcoverStatus():GroundcoverArtStats|null{
    return this.sceneryArt.groundcoverStats;
  }
  async loadSceneryArt(placements:readonly SceneryPlacement[],
    seed:string|number="fenwall-crossing-v1",
    includeGroundcover=true):Promise<SceneryArtStats> {
    this.assertActive();
    return this.sceneryArt.load(placements,seed,includeGroundcover);
  }
  get environmentReady(): boolean { return this.environment.ready; }
  /** Load optional art atomically; preserved procedural actors and pads remain
   * valid collision/selection fallbacks until these GLBs are fully decoded. */
  async loadEnvironmentArt(keep:EnvironmentPlacement,
    pads:readonly EnvironmentPadPlacement[],sourceKitPads=false):Promise<EnvironmentArtStatus> {
    this.assertActive();
    return this.environment.load(keep,pads,sourceKitPads);
  }
  async loadRiggedCharacters(): Promise<RiggedCharacterStats> {
    this.assertActive();
    return this.animatedCharacters.load();
  }
  setRiggedAnimationTime(seconds:number,animateFoliage=true): void {
    this.animatedCharacters.setTime(seconds);
    this.sceneryArt.setWindTime(animateFoliage?seconds:0);
  }
  setActorMotion(model:ArrayLike<number>, motion:ActorMotion["motion"],timeSeconds:number):void {
    this.animatedCharacters.setMotion(model,motion,timeSeconds);
  }
  get canvas(): HTMLCanvasElement { return this.gpu.domElement; }
  get unifiedContext(): WebGL2RenderingContext {
    return this.gpu.getContext() as WebGL2RenderingContext;
  }
  /** Actual GPU drawing-buffer dimensions, not the browser's CSS canvas box. */
  get backbufferSize(): Readonly<{width:number;height:number}> {
    this.assertActive();
    const size=this.gpu.getDrawingBufferSize(new Vector2());
    return {width:size.x,height:size.y};
  }
  /**
   * Resize an existing Three context through WebGLRenderer rather than assigning
   * canvas.width/height directly (which would reset WebGL state behind Three).
   * The caller supplies already-DPR-adjusted physical pixels, so pixelRatio=1.
   */
  resizeBackbuffer(width:number,height:number):boolean {
    this.assertActive();
    if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
       width<1||height<1||width>16384||height>16384) {
      throw new RangeError("Invalid physical WebGL backbuffer dimensions");
    }
    if(this.canvas.width===width&&this.canvas.height===height)return false;
    this.gpu.setSize(width,height,false);
    this.illustratedFX.resize();
    const actual=this.backbufferSize;
    if(actual.width!==width||actual.height!==height||
       this.unifiedContext.drawingBufferWidth!==width||
       this.unifiedContext.drawingBufferHeight!==height) {
      throw new Error("Three/WebGL physical drawing buffer mismatch: "+
        JSON.stringify({requested:[width,height],actual}));
    }
    return true;
  }

  /** The painted ground's RGB can be set only before any render variants.
   * This does NOT change world height, navigation, physics or culling. */
  enableGroundPigment(seed:number|string):void {
    this.assertActive();
    if(this.variants.size>0||this.groundPigmentSeed!==undefined)
      throw new Error("Ground pigments must be configured before first render");
    if((typeof seed==="number" && !Number.isFinite(seed)) ||
        (typeof seed==="string" && !seed.length))
      throw new RangeError("Invalid deterministic ground seed");
    this.groundPigmentSeed=seed;
  }
  get paintedGroundEnabled():boolean{return this.groundPigmentSeed!==undefined;}

  uploadMesh(id: string, geometry: Geometry): void {
    this.assertActive();
    if (!id || this.stored.has(id)) throw new Error("Duplicate or invalid mesh: " + id);
    validateGeometry(geometry);
    this.stored.set(id, geometry);
    this.bytes += geometry.positions.byteLength + geometry.normals.byteLength
      + geometry.materialIds.byteLength + geometry.indices.byteLength;
  }

  /** Load the exact same locally bundled source from ART.01 into THIS scene. */
  async loadPilotLantern(groundY: number): Promise<ImportedAssetStatus> {
    this.assertActive();
    if (this.sourceStatus || !Number.isFinite(groundY)) {
      throw new Error("Lantern may be loaded only once at a finite ground height");
    }
    const source = TERRAIN_ASSETS.pilotLantern;
    const response = await fetch(source.url, { cache: "force-cache" });
    if (!response.ok) throw new Error("Bundled GLB HTTP " + response.status);
    const array = await response.arrayBuffer();
    if (array.byteLength < 24 || new DataView(array).getUint32(0,true)!==0x46546c67) {
      throw new Error("Invalid locally bundled GLB header");
    }
    const gltf = await new GLTFLoader().parseAsync(array, "/assets/");
    if (this.destroyed) throw new Error("Renderer disposed during GLB load");
    const box = new Box3().setFromObject(gltf.scene);
    const extent = box.getSize(new Vector3());
    if (!Number.isFinite(extent.y) || extent.y < 0.01) {
      throw new Error("Degenerate authored 3D model");
    }
    gltf.scene.scale.setScalar(source.displayHeightMeters / extent.y);
    const normalized = new Box3().setFromObject(gltf.scene);
    const center = normalized.getCenter(new Vector3());
    gltf.scene.position.set(-center.x, -normalized.min.y, -center.z);
    let meshCount=0, texturedMaterials=0;
    gltf.scene.traverse(child => {
      if (!(child instanceof Mesh)) return;
      meshCount++;
      child.castShadow = true;
      child.receiveShadow = true;
      for (const material of Array.isArray(child.material)
        ? child.material : [child.material]) {
        if ((material as MeshStandardMaterial).map) texturedMaterials++;
      }
    });
    if (meshCount<1 || texturedMaterials<1) throw new Error("GLB has no authored PBR texture");
    this.imported.add(gltf.scene);
    this.imported.position.set(source.position[0], groundY, source.position[2]);
    const result = Object.freeze({
      sourceId: source.id, meshCount, texturedMaterials,
      widthMeters: extent.x*source.displayHeightMeters/extent.y,
      heightMeters: source.displayHeightMeters,
    });
    this.sourceStatus = result;
    return result;
  }

  render(camera: CameraMatrices & { projection?: ArrayLike<number> },
    instances: readonly RenderInstance[]): RenderStats {
    this.assertActive();
    if (!matrixIsValid(camera.view) || !matrixIsValid(camera.viewProjection)
      || !camera.projection || !matrixIsValid(camera.projection)) {
      throw new RangeError("Unified Three renderer requires valid view, projection and VP");
    }
    const started = performance.now();
    this.camera.projectionMatrix.fromArray(camera.projection);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    this.camera.matrixWorldInverse.fromArray(camera.view);
    this.camera.matrixWorld.copy(this.camera.matrixWorldInverse).invert();
    this.camera.matrixAutoUpdate = false;
    this.camera.matrixWorldAutoUpdate = false;

    const batches = new Map<string, Submitted>();
    // The artist's actual skinned GLBs replace the old primitive meshes only
    // after all three have loaded, so a network/GLB failure preserves gameplay.
    const riggedActors = this.animatedCharacters.sync(instances);
    let culled = 0, submitted = 0, triangles = 0, visible = 0;
    for (let index=0;index<instances.length;index++) {
      const source=instances[index]!;
      if (!matrixIsValid(source.model)) throw new RangeError("Nonfinite 3D model matrix");
      const geometry = this.stored.get(source.meshId);
      if (!geometry) throw new Error("Unknown original mesh: " + source.meshId);
      const opacity = source.opacity ?? 1;
      if (!(opacity>=0 && opacity<=1)) throw new RangeError("Opacity outside [0,1]");
      submitted++;
      if (opacity===0) continue;
      if (riggedActors.has(index)) {
        visible++; // actual same-scene SkinnedMesh replaces the instanced actor
        continue;
      }
      if (this.sceneryArt.ready && this.sceneryArt.groundcoverReady &&
          (source.meshId==="scenery-grass" ||
           source.meshId==="scenery-flower")) {
        // Authored 3D grasses/flowers have been fully loaded into the SAME
        // depth/color scene. The source low-poly cards remain fallback only.
        culled++;
        continue;
      }
      if (this.sceneryArt.ready &&
          (source.meshId==="scenery-pine" ||
           source.meshId==="scenery-broadleaf" ||
           source.meshId==="scenery-rock")) {
        // The same authoritative F2.05 positions are now drawn by batched
        // source-verified 3D GLBs, never by both old and new visual systems.
        culled++;
        continue;
      }
      if (this.environment.ready &&
          (source.meshId==="staged-core" || source.meshId==="carved-pad")) {
        // Authored textured castle architecture occupies identical world
        // locations. Retire only its original visual mesh; the deterministic
        // collision, build-pad hit regions and site positions remain untouched.
        culled++;
        continue;
      }
      if (this.useCulling
        && !aabbIntersectsFrustum(geometry.bounds,source.model,camera.viewProjection)) {
        culled++;
        continue;
      }
      // Quantization limits unbounded material-pool growth for transient hit glints.
      const fade = opacity < 1 ? Math.max(0.05, Math.round(opacity*20)/20) : 1;
      const key = source.meshId + "|" + source.material + "|" + fade;
      let batch = batches.get(key);
      if (!batch) {
        batch = {meshId:source.meshId, material:source.material,opacity:fade,models:[]};
        batches.set(key,batch);
      }
      batch.models.push(source.model);
      visible++;
      triangles += geometry.indices.length/3;
    }
    for (const pool of this.pools.values()) pool.mesh.visible=false;
    let opaque=0,transparent=0,activeCapacity=0;
    for (const [key,batch] of batches) {
      const geomKey = batch.meshId+"|"+batch.material;
      let geom=this.variants.get(geomKey);
      if (!geom) {
        geom=toThreeGeometry(this.stored.get(batch.meshId)!,batch.material,
          batch.meshId==="island-static-ground"?this.groundPigmentSeed:undefined);
        this.variants.set(geomKey,geom);
      }
      let pool=this.pools.get(key);
      if (!pool || pool.capacity<batch.models.length) {
        if (pool) {
          this.scene.remove(pool.mesh);
          pool.mesh.dispose();
          pool.material.dispose();
        }
        const material = new MeshStandardMaterial({
          color:0xffffff, vertexColors:true,roughness:0.93,metalness:0.0,
          transparent:batch.opacity<1,opacity:batch.opacity,
          depthWrite:batch.opacity===1,
        });
        // Only meaningful real physical projectiles/impacts exceed the HDR
        // bloom threshold; meadow, roads and towers stay crisp and unbloomed.
        setCombatEmissive(material,batch.meshId);
        const capacity = Math.max(batch.models.length, pool?.capacity??0, 1);
        const mesh=new InstancedMesh(geom,material,capacity);
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        mesh.frustumCulled=false; // per-instance bounds are checked above
        mesh.castShadow=batch.opacity===1 && batch.meshId!=="north-river-water";
        mesh.receiveShadow=true;
        this.scene.add(mesh);
        pool={mesh,capacity,material};
        this.pools.set(key,pool);
      }
      pool.mesh.count=batch.models.length;
      pool.mesh.visible=true;
      for(let i=0;i<batch.models.length;i++) {
        this.matrix.fromArray(batch.models[i]!);
        pool.mesh.setMatrixAt(i,this.matrix);
      }
      pool.mesh.instanceMatrix.needsUpdate=true;
      activeCapacity+=pool.capacity;
      if(batch.opacity<1)transparent++; else opaque++;
    }
    // Single draw through ONE WebGLRenderer: imported PBR + existing 3D meshes
    // now share depth, directional shadow atlas, camera and color pipeline.
    this.gpu.info.reset();
    this.illustratedFX.render();
    const gpuDraws=this.gpu.info.render.calls;
    return {
      submitted, instances:visible, culled, drawCalls:gpuDraws,
      shadowDrawCalls:this.useShadows?opaque:0,
      shadowInstances:this.useShadows?visible:0,
      shadowTriangles:this.useShadows?triangles:0,
      opaqueDrawCalls:opaque,transparentDrawCalls:transparent,
      triangles, estimatedGpuBytes:this.estimatedGpuBytes,
      cpuMilliseconds:performance.now()-started,instanceCapacity:activeCapacity,
    };
  }

  abandonOnContextLoss(): void { this.dispose(); }
  dispose(): void {
    if (this.destroyed) return;
    this.destroyed=true;
    for(const g of this.variants.values())g.dispose();
    for(const p of this.pools.values()) {
      p.mesh.dispose();
      p.material.dispose();
    }
    this.imported.traverse(node=>{
      if (!(node instanceof Mesh)) return;
      node.geometry.dispose();
      for (const m of Array.isArray(node.material)?node.material:[node.material]) {
        const mat=m as MeshStandardMaterial;
        mat.map?.dispose();
        mat.normalMap?.dispose();
        mat.roughnessMap?.dispose();
        mat.metalnessMap?.dispose();
        mat.emissiveMap?.dispose();
        mat.dispose();
      }
    });
    this.animatedCharacters.dispose();
    this.environment.dispose();
    this.sceneryArt.dispose();
    this.illustratedFX.dispose();
    this.gpu.dispose();
    this.pools.clear();
    this.variants.clear();
    this.stored.clear();
  }
  private assertActive(): void {
    if(this.destroyed)throw new Error("Unified Three renderer inactive");
  }
}
