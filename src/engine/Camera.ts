/**
 * F1.02 — fixed-angle orthographic camera for the Bastionfall world.
 *
 * World space: X east, Y up, Z north. Viewport coordinates are CSS pixels,
 * origin at top-left. All projection math is delegated to gl-matrix 3.4.4.
 * Camera movement affects rendering only; it never mutates simulation state.
 */
import { mat4, vec3 } from "gl-matrix";

export type WorldPoint = readonly [number, number, number];
export type HorizontalLead = readonly [number, number];

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly visible: boolean;
}

export const CAMERA_SPEC = {
  azimuthDegrees: 45,
  tiltFromHorizonDegrees: 53,
  viewHeightMeters: 31,
  zoomMin: 0.88,
  zoomMax: 1.12,
  followTimeConstantSeconds: 0.17,
  eyeDistanceMeters: 64,
  nearMeters: 0.1,
  farMeters: 180,
} as const;

const RAD = Math.PI / 180;
const AZIMUTH = CAMERA_SPEC.azimuthDegrees * RAD;
const TILT = CAMERA_SPEC.tiltFromHorizonDegrees * RAD;
const HORIZONTAL_EYE = Math.cos(TILT) * CAMERA_SPEC.eyeDistanceMeters;
const EYE_OFFSET: WorldPoint = [
  HORIZONTAL_EYE * Math.cos(AZIMUTH),
  Math.sin(TILT) * CAMERA_SPEC.eyeDistanceMeters,
  HORIZONTAL_EYE * Math.sin(AZIMUTH),
];
const UP = vec3.fromValues(0, 1, 0);

function requirePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(label + " must be a finite positive number");
  }
}

function requireWorld(point: WorldPoint): void {
  if (point.length !== 3 || !point.every(Number.isFinite)) {
    throw new RangeError("World positions must contain three finite coordinates");
  }
}

export class OrthoCamera {
  private readonly focus = vec3.create();
  private readonly view = mat4.create();
  private readonly projection = mat4.create();
  private readonly viewProjection = mat4.create();
  private readonly inverseViewProjection = mat4.create();
  private widthPx: number;
  private heightPx: number;
  private zoom = 1;

  constructor(widthPx: number, heightPx: number, initialFocus: WorldPoint = [0, 0, 0]) {
    requirePositive(widthPx, "Viewport width");
    requirePositive(heightPx, "Viewport height");
    requireWorld(initialFocus);
    this.widthPx = widthPx;
    this.heightPx = heightPx;
    this.snapTo(initialFocus);
  }

  get viewport(): Readonly<{ width: number; height: number }> {
    return { width: this.widthPx, height: this.heightPx };
  }

  get focusWorld(): WorldPoint {
    return [this.focus[0], this.focus[1], this.focus[2]];
  }

  get zoomFactor(): number {
    return this.zoom;
  }

  get visibleWorldHeight(): number {
    return CAMERA_SPEC.viewHeightMeters / this.zoom;
  }

  get visibleWorldWidth(): number {
    return this.visibleWorldHeight * this.widthPx / this.heightPx;
  }

  /** Returned matrices are copies; consumers cannot change camera state. */
  get matrices(): Readonly<{ view: mat4; projection: mat4; viewProjection: mat4 }> {
    return {
      view: mat4.clone(this.view),
      projection: mat4.clone(this.projection),
      viewProjection: mat4.clone(this.viewProjection),
    };
  }

  resize(widthPx: number, heightPx: number): void {
    requirePositive(widthPx, "Viewport width");
    requirePositive(heightPx, "Viewport height");
    this.widthPx = widthPx;
    this.heightPx = heightPx;
    this.recalculate();
  }

  /** Zoom greater than 1 shows less world; clamp to design-bible range. */
  setZoom(requestedZoom: number): void {
    requirePositive(requestedZoom, "Zoom");
    this.zoom = Math.min(CAMERA_SPEC.zoomMax, Math.max(CAMERA_SPEC.zoomMin, requestedZoom));
    this.recalculate();
  }

  /** Immediately positions the camera. Height is accepted for cinematic target points. */
  snapTo(worldFocus: WorldPoint): void {
    requireWorld(worldFocus);
    vec3.set(this.focus, worldFocus[0], worldFocus[1], worldFocus[2]);
    this.recalculate();
  }

  /**
   * Exponential follow smoothing; identical result for equal total elapsed time
   * regardless of rendering frame partition. Lead is a caller-owned X/Z offset,
   * intended to put the focus slightly ahead of the hero's direction of travel.
   */
  follow(hero: WorldPoint, elapsedSeconds: number, leadXZ: HorizontalLead = [0, 0]): void {
    requireWorld(hero);
    if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
      throw new RangeError("Follow elapsed time must be finite and non-negative");
    }
    if (leadXZ.length !== 2 || !leadXZ.every(Number.isFinite)) {
      throw new RangeError("Camera lead must have two finite X/Z coordinates");
    }
    if (elapsedSeconds === 0) return;
    const weight = -Math.expm1(-elapsedSeconds / CAMERA_SPEC.followTimeConstantSeconds);
    // Ground-plane tracking: hero's jump animation must not bounce the camera.
    const targetX = hero[0] + leadXZ[0];
    const targetZ = hero[2] + leadXZ[1];
    this.focus[0] += (targetX - this.focus[0]) * weight;
    this.focus[2] += (targetZ - this.focus[2]) * weight;
    this.recalculate();
  }

  /** Convert a 3D world point to top-left-origin CSS coordinates. */
  project(world: WorldPoint): ScreenPoint {
    requireWorld(world);
    const ndc = vec3.transformMat4(vec3.create(), world, this.viewProjection);
    const x = (ndc[0] + 1) * 0.5 * this.widthPx;
    const y = (1 - ndc[1]) * 0.5 * this.heightPx;
    return {
      x, y,
      depth: (ndc[2] + 1) * 0.5,
      visible: ndc[0] >= -1 && ndc[0] <= 1
        && ndc[1] >= -1 && ndc[1] <= 1
        && ndc[2] >= -1 && ndc[2] <= 1,
    };
  }

  /**
   * Intersect the screen's orthographic ray with a horizontal world plane.
   * Returns null if the ray is parallel or intersects outside clip planes.
   * CSS pixel coordinates are relative to the canvas, not the document.
   */
  screenToGround(x: number, y: number, planeY = 0): WorldPoint | null {
    if (![x, y, planeY].every(Number.isFinite)) {
      throw new RangeError("Screen and plane coordinates must be finite");
    }
    const ndcX = 2 * x / this.widthPx - 1;
    const ndcY = 1 - 2 * y / this.heightPx;
    const near = vec3.transformMat4(
      vec3.create(), vec3.fromValues(ndcX, ndcY, -1), this.inverseViewProjection,
    );
    const far = vec3.transformMat4(
      vec3.create(), vec3.fromValues(ndcX, ndcY, 1), this.inverseViewProjection,
    );
    const deltaY = far[1] - near[1];
    if (Math.abs(deltaY) < 1e-8) return null;
    const t = (planeY - near[1]) / deltaY;
    if (t < 0 || t > 1) return null;
    return [
      near[0] + (far[0] - near[0]) * t,
      planeY,
      near[2] + (far[2] - near[2]) * t,
    ];
  }

  private recalculate(): void {
    const halfHeight = this.visibleWorldHeight / 2;
    const halfWidth = this.visibleWorldWidth / 2;
    const eye = vec3.fromValues(
      this.focus[0] + EYE_OFFSET[0],
      this.focus[1] + EYE_OFFSET[1],
      this.focus[2] + EYE_OFFSET[2],
    );
    mat4.lookAt(this.view, eye, this.focus, UP);
    // gl-matrix 3.4.4 ortho uses OpenGL/WebGL clip-Z [-1, +1].
    mat4.ortho(
      this.projection,
      -halfWidth, halfWidth, -halfHeight, halfHeight,
      CAMERA_SPEC.nearMeters, CAMERA_SPEC.farMeters,
    );
    mat4.multiply(this.viewProjection, this.projection, this.view);
    if (!mat4.invert(this.inverseViewProjection, this.viewProjection)) {
      throw new Error("Orthographic view-projection matrix is non-invertible");
    }
  }
}
