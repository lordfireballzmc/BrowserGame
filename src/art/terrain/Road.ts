/**
 * F2.02 — authored road mesh, lane edges and sparse embedded wheel ruts.
 *
 * The ground height is carved to y=0 along the corridor by Island.ts.
 * Road top lies 0.04m above it: no carpet floating over hills, no z-fighting.
 * Ruts are short longitudinal inset markings, one every >=3.5m, not a
 * high-frequency repetitive texture. Meshes use F1.03's validated layout.
 */
import type { Geometry, Point3 } from "../mesh/Primitives";
import { validateGeometry } from "../mesh/Primitives";
import { MATERIAL_TOKENS } from "../../engine/render/Palette";
import {
  ROAD_SPEC, ROAD_SAMPLES, ROAD_LENGTH_METERS,
  nearestRoadPoint, roadPointAtDistance,
  type RoadPoint,
} from "./RoadPath";

export interface RoadCrossSection {
  readonly distance: number;
  readonly center: Point3;
  readonly left: Point3;
  readonly right: Point3;
  readonly widthMeters: number;
}

export interface AuthoredRoad {
  readonly surface: Geometry;
  readonly crossSections: readonly RoadCrossSection[];
  readonly lengthMeters: number;
  readonly sampleStepMaxMeters: number;
  readonly rutCount: number;
}

const SLOT_PRIMARY = MATERIAL_TOKENS.indexOf("road.primary") + 1;
const SLOT_RUT = MATERIAL_TOKENS.indexOf("road.rut") + 1;
const HEIGHT = ROAD_SPEC.heightAboveSurfaceMeters;
const RUT_HEIGHT = HEIGHT + 0.012;

class RoadMesh {
  private positions: number[] = [];
  private normals: number[] = [];
  private materials: number[] = [];
  private indices: number[] = [];
  private min = [Infinity, Infinity, Infinity];
  private max = [-Infinity, -Infinity, -Infinity];

  triangle(a: Point3, b: Point3, c: Point3, slot: number): void {
    const dx = b[0] - a[0], dz = b[2] - a[2];
    const ex = c[0] - a[0], ez = c[2] - a[2];
    let second = b, third = c;
    const yCross = dz * ex - dx * ez;
    if (Math.abs(yCross) < 1e-10) throw new Error("Degenerate road cross-section");
    if (yCross < 0) {
      second = c;
      third = b;
    }
    const start = this.positions.length / 3;
    for (const v of [a, second, third]) {
      this.positions.push(...v);
      this.normals.push(0, 1, 0);
      this.materials.push(slot);
      for (let axis = 0; axis < 3; axis++) {
        this.min[axis] = Math.min(this.min[axis]!, v[axis]!);
        this.max[axis] = Math.max(this.max[axis]!, v[axis]!);
      }
    }
    this.indices.push(start, start + 1, start + 2);
  }

  finish(): Geometry {
    const positions = new Float32Array(this.positions);
    const geometry: Geometry = {
      positions, normals: new Float32Array(this.normals),
      indices: positions.length / 3 <= 65535
        ? new Uint16Array(this.indices) : new Uint32Array(this.indices),
      materialIds: new Uint8Array(this.materials),
      bounds: {
        min: [this.min[0]!, this.min[1]!, this.min[2]!],
        max: [this.max[0]!, this.max[1]!, this.max[2]!],
      },
    };
    validateGeometry(geometry);
    return geometry;
  }
}

function edge(section: RoadPoint, offset: number, height = HEIGHT): Point3 {
  // Left is a 90° anticlockwise turn from travel (X,Z).
  return [
    section.x - section.tangent[1] * offset,
    height,
    section.z + section.tangent[0] * offset,
  ];
}

let cached: AuthoredRoad | null = null;

/** One deterministic CPU mesh for this fixed stage template, cached after creation. */
export function createAuthoredRoad(): AuthoredRoad {
  if (cached) return cached;
  const mesh = new RoadMesh();
  const crossSections = ROAD_SAMPLES.map((p): RoadCrossSection => {
    const left = edge(p, ROAD_SPEC.halfWidthMeters);
    const right = edge(p, -ROAD_SPEC.halfWidthMeters);
    return Object.freeze({
      distance: p.distance,
      center: [p.x, HEIGHT, p.z],
      left, right,
      widthMeters: Math.hypot(left[0] - right[0], left[2] - right[2]),
    });
  });

  let maxStep = 0;
  for (let i = 0; i < crossSections.length - 1; i++) {
    const a = crossSections[i]!, b = crossSections[i + 1]!;
    maxStep = Math.max(maxStep, Math.hypot(
      b.center[0] - a.center[0], b.center[2] - a.center[2],
    ));
    mesh.triangle(a.left, b.left, a.right, SLOT_PRIMARY);
    mesh.triangle(a.right, b.left, b.right, SLOT_PRIMARY);
  }

  // One short, intentional wagon-rut dash every 3.5m, alternating wheel tracks.
  let rutCount = 0;
  for (let start = 3.5; start + 1.5 < ROAD_LENGTH_METERS - 2; start += 3.5) {
    const first = roadPointAtDistance(start);
    const last = roadPointAtDistance(start + 1.45);
    const wheelOffset = rutCount % 2 === 0 ? -1.10 : 1.10;
    const halfRutWidth = 0.085;
    const a = edge(first, wheelOffset - halfRutWidth, RUT_HEIGHT);
    const b = edge(first, wheelOffset + halfRutWidth, RUT_HEIGHT);
    const c = edge(last, wheelOffset - halfRutWidth, RUT_HEIGHT);
    const d = edge(last, wheelOffset + halfRutWidth, RUT_HEIGHT);
    mesh.triangle(a, c, b, SLOT_RUT);
    mesh.triangle(b, c, d, SLOT_RUT);
    rutCount++;
  }

  const result: AuthoredRoad = Object.freeze({
    surface: mesh.finish(),
    crossSections: Object.freeze(crossSections),
    lengthMeters: ROAD_LENGTH_METERS,
    sampleStepMaxMeters: maxStep,
    rutCount,
  });
  cached = result;
  return result;
}

/** Stable 4.5m-wide horizontal collision lane, no canvas pixel dependence. */
export function isInsideRoadLane(x: number, z: number, radiusMeters = 0): boolean {
  if (!Number.isFinite(radiusMeters) || radiusMeters < 0
    || radiusMeters > ROAD_SPEC.halfWidthMeters) {
    throw new RangeError("Road collision radius must be between zero and half-width");
  }
  return nearestRoadPoint(x, z).lateralDistance
    <= ROAD_SPEC.halfWidthMeters - radiusMeters + 1e-8;
}
