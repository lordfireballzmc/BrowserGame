/**
 * Asset-first renderer migration pilot. Deliberately temporary compositing
 * bridge: the existing WebGL2 game owns gameplay, terrain and camera; Three
 * renders ONE real licensed textured glTF model in world coordinates until
 * the full scene transitions to a single renderer. Not a game-asset quality
 * claim, nor a permanent two-renderer architecture.
 */
import {
  AmbientLight, Box3, Camera, DirectionalLight, Group, Matrix4,
  NeutralToneMapping, PointLight, Scene, SRGBColorSpace, Vector3,
  WebGLRenderer, type Object3D,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { mat4 } from "gl-matrix";
import { TERRAIN_ASSETS } from "../../art/assets/AssetManifest";

export interface GameCameraMatrices {
  readonly view: mat4;
  readonly projection: mat4;
  readonly viewProjection: mat4;
}
export interface ImportedAssetStatus {
  readonly meshCount: number;
  readonly texturedMaterials: number;
  readonly widthMeters: number;
  readonly heightMeters: number;
  readonly sourceId: string;
}
type Stage = HTMLElement & { dataset: DOMStringMap };

export class ImportedArtLayer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new Camera();
  private readonly lamp = new Group();
  private disposed = false;
  private loaded = false;
  private last: ImportedAssetStatus | null = null;

  constructor(private readonly stage: Stage, readonly width: number, readonly height: number) {
    if (width <= 0 || height <= 0) throw new RangeError("Invalid imported asset viewport");
    this.renderer = new WebGLRenderer({
      alpha: true, antialias: true, preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1); // bounded: never allocate retina x4 in dual renderer
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.assetOverlay = "three-webgl2";
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1";
    stage.appendChild(canvas);

    this.scene.add(new AmbientLight(0xb9d7d8, 1.4));
    const sun = new DirectionalLight(0xffe1ab, 2.7);
    sun.position.set(-20, 40, 35);
    this.scene.add(sun);
    const lanternGlow = new PointLight(0xffa95a, 12, 5, 2);
    lanternGlow.position.set(0, 1.65, 0);
    this.lamp.add(lanternGlow);
    this.scene.add(this.lamp);

    // Prevent a second stage from accidentally starting an independent loop.
    // Caller drives rendering from the same interpolated game camera/frame.
    this.stage.dataset.assetPipeline = "loading";
  }

  async load(): Promise<ImportedAssetStatus> {
    if (this.disposed) throw new Error("Asset layer disposed");
    const source = TERRAIN_ASSETS.pilotLantern;
    const response = await fetch(source.url, { cache: "force-cache" });
    if (!response.ok) throw new Error("Local bundled GLB missing: " + response.status);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 24 || new DataView(bytes).getUint32(0, true) !== 0x46546c67) {
      throw new Error("Bundled asset is not valid binary glTF");
    }
    const gltf = await new GLTFLoader().parseAsync(bytes, "/assets/");
    if (this.disposed) {
      gltf.scene.traverse(node => {
        if (node.type === "Mesh") {
          const mesh = node as import("three").Mesh;
          mesh.geometry?.dispose();
        }
      });
      throw new Error("Asset load completed after disposal");
    }
    const bounds = new Box3().setFromObject(gltf.scene);
    const size = bounds.getSize(new Vector3());
    if (!(size.y > 0.01) || !Number.isFinite(size.y)) {
      throw new Error("3D model has a degenerate bounding box");
    }
    const scale = source.displayHeightMeters / size.y;
    gltf.scene.scale.setScalar(scale);
    const normalized = new Box3().setFromObject(gltf.scene);
    const center = normalized.getCenter(new Vector3());
    // Ground it by the ACTUAL base of the imported geometry, not an assumed pivot.
    gltf.scene.position.set(-center.x, -normalized.min.y, -center.z);
    this.lamp.add(gltf.scene);
    this.lamp.position.set(source.position[0], source.position[1], source.position[2]);

    let meshCount = 0, texturedMaterials = 0;
    gltf.scene.traverse(node => {
      if (node.type !== "Mesh") return;
      meshCount++;
      const mesh = node as import("three").Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if ("map" in material && material.map) texturedMaterials++;
      }
    });
    if (meshCount < 1 || texturedMaterials < 1) {
      throw new Error("GLB pilot failed: no real textured PBR mesh");
    }
    const status = Object.freeze({
      meshCount, texturedMaterials,
      widthMeters: size.x * scale,
      heightMeters: source.displayHeightMeters,
      sourceId: source.id,
    });
    this.last = status;
    this.loaded = true;
    this.stage.dataset.assetPipeline = "loaded";
    return status;
  }

  get status(): ImportedAssetStatus | null { return this.last; }
  get ready(): boolean { return this.loaded && !this.disposed; }

  render(matrices: GameCameraMatrices): void {
    if (!this.ready) return;
    if (this.disposed) return;
    // Copy the EXACT native gl-matrix camera, no independently wandering camera.
    this.camera.projectionMatrix.fromArray(matrices.projection);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    this.camera.matrixWorldInverse.fromArray(matrices.view);
    this.camera.matrixWorld.copy(this.camera.matrixWorldInverse).invert();
    this.camera.matrixAutoUpdate = false;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.traverse(node => {
      if (node.type !== "Mesh") return;
      const mesh = node as import("three").Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if ("map" in material && material.map) material.map.dispose();
        material.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.stage.dataset.assetPipeline = "disposed";
  }
}
