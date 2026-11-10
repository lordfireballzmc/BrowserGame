/**
 * F1.03 — deterministic flat-shaded procedural mesh construction.
 *
 * World coordinates are right-handed X east / Y up / Z north. All shapes
 * are in meters, centered at the origin unless stated otherwise. Faces use
 * outward-facing CCW winding, distinct vertices for hard normals, and
 * Uint16/Uint32 indexed triangles. No GPU work or per-frame allocations.
 */
export type Point3 = readonly [number, number, number];
export type PointXZ = readonly [number, number];

export interface Geometry {
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly indices: Uint16Array | Uint32Array;
  /** One semantic material-slot index per vertex, for future palette rendering. */
  readonly materialIds: Uint8Array;
  readonly bounds: Readonly<{ min: Point3; max: Point3 }>;
}

const TWO_PI = Math.PI * 2;

function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(label + " must be finite and greater than zero");
  }
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(label + " must be finite");
}

function subdivisions(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(label + " must be an integer from " + min + " through " + max);
  }
}

function materialSlot(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError("Material ID must be a byte (0–255)");
  }
}

function subtract(a: Point3, b: Point3): Point3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Point3, b: Point3): Point3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Point3, b: Point3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function length(a: Point3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Detect malformed geometry before it reaches any WebGL buffer upload. */
export function validateGeometry(geometry: Geometry): void {
  const { positions, normals, indices, materialIds, bounds } = geometry;
  if (positions.length === 0 || positions.length % 3 !== 0) {
    throw new Error("Mesh position array must contain complete vertices");
  }
  if (normals.length !== positions.length || materialIds.length !== positions.length / 3) {
    throw new Error("Mesh normals and material slots must align with vertices");
  }
  if (indices.length === 0 || indices.length % 3 !== 0) {
    throw new Error("Mesh indices must contain complete triangles");
  }
  const count = positions.length / 3;
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i += 1) {
    const p: Point3 = [positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!];
    const n: Point3 = [normals[i * 3]!, normals[i * 3 + 1]!, normals[i * 3 + 2]!];
    for (let axis = 0; axis < 3; axis += 1) {
      if (!Number.isFinite(p[axis]) || !Number.isFinite(n[axis])) {
        throw new Error("Mesh positions and normals must be finite");
      }
      minimum[axis] = Math.min(minimum[axis]!, p[axis]!);
      maximum[axis] = Math.max(maximum[axis]!, p[axis]!);
    }
    if (Math.abs(length(n) - 1) > 0.0001) {
      throw new Error("Mesh normal must be a unit vector");
    }
  }
  for (let axis = 0; axis < 3; axis += 1) {
    if (!Number.isFinite(bounds.min[axis]) || !Number.isFinite(bounds.max[axis])
      || Math.abs(bounds.min[axis]! - minimum[axis]!) > 0.00001
      || Math.abs(bounds.max[axis]! - maximum[axis]!) > 0.00001) {
      throw new Error("Mesh bounds must match vertex extents");
    }
  }

  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]!, b = indices[t + 1]!, c = indices[t + 2]!;
    if (a >= count || b >= count || c >= count || a === b || b === c || a === c) {
      throw new Error("Mesh index points out of range or repeats a triangle vertex");
    }
    const v = (index: number): Point3 => [
      positions[index * 3]!, positions[index * 3 + 1]!, positions[index * 3 + 2]!,
    ];
    const n: Point3 = [normals[a * 3]!, normals[a * 3 + 1]!, normals[a * 3 + 2]!];
    const areaVector = cross(subtract(v(b), v(a)), subtract(v(c), v(a)));
    if (length(areaVector) <= 1e-11) throw new Error("Mesh contains a zero-area triangle");
    if (dot(areaVector, n) <= 0) {
      throw new Error("Mesh normal and triangle winding disagree");
    }
  }
}

class MeshBuilder {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly materialIds: number[] = [];
  private readonly indices: number[] = [];

  constructor(private readonly materialId: number) {
    materialSlot(materialId);
  }

  /** Flat polygon; caller gives the direction the face should point toward. */
  face(points: readonly Point3[], outward: Point3): void {
    if (points.length !== 3 && points.length !== 4) {
      throw new Error("Geometry builder only accepts triangular and quadrilateral faces");
    }
    const initial = cross(subtract(points[1]!, points[0]!), subtract(points[2]!, points[0]!));
    const size = length(initial);
    if (size <= 1e-11) throw new Error("Degenerate polygon in procedural geometry");
    const facing = dot(initial, outward);
    if (Math.abs(facing) <= 1e-11) throw new Error("Ambiguous polygon outward direction");
    const ordered = facing < 0 ? [...points].reverse() : [...points];
    const n = facing < 0
      ? [-initial[0] / size, -initial[1] / size, -initial[2] / size]
      : [initial[0] / size, initial[1] / size, initial[2] / size];
    const start = this.positions.length / 3;
    for (const point of ordered) {
      if (!point.every(Number.isFinite)) throw new RangeError("Nonfinite procedural vertex");
      this.positions.push(...point);
      this.normals.push(...n);
      this.materialIds.push(this.materialId);
    }
    this.indices.push(start, start + 1, start + 2);
    if (ordered.length === 4) this.indices.push(start, start + 2, start + 3);
  }

  /** Convex solid: orient against a point guaranteed to lie inside it. */
  convexFace(points: readonly Point3[], interior: Point3 = [0, 0, 0]): void {
    const center: Point3 = [
      points.reduce((sum, p) => sum + p[0], 0) / points.length,
      points.reduce((sum, p) => sum + p[1], 0) / points.length,
      points.reduce((sum, p) => sum + p[2], 0) / points.length,
    ];
    this.face(points, subtract(center, interior));
  }

  finish(): Geometry {
    const positions = new Float32Array(this.positions);
    const normals = new Float32Array(this.normals);
    const vertexCount = positions.length / 3;
    const indices = vertexCount <= 65535
      ? new Uint16Array(this.indices) : new Uint32Array(this.indices);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        const v = positions[i + axis]!;
        min[axis] = Math.min(min[axis]!, v);
        max[axis] = Math.max(max[axis]!, v);
      }
    }
    const result: Geometry = {
      positions, normals, indices, materialIds: new Uint8Array(this.materialIds),
      bounds: {
        min: [min[0]!, min[1]!, min[2]!],
        max: [max[0]!, max[1]!, max[2]!],
      },
    };
    validateGeometry(result);
    return result;
  }
}

/** Genuine planar edge/chamfer faces and triangular corners, not scaled cubes. */
export function bevelBox(
  width: number, height: number, depth: number, bevel = 0, materialId = 0,
): Geometry {
  positive(width, "Box width"); positive(height, "Box height"); positive(depth, "Box depth");
  finite(bevel, "Bevel");
  const [hx, hy, hz] = [width / 2, height / 2, depth / 2];
  if (bevel < 0 || bevel >= Math.min(hx, hy, hz)) {
    throw new RangeError("Box bevel must be non-negative and smaller than every half-extent");
  }
  const [ix, iy, iz] = [hx - bevel, hy - bevel, hz - bevel];
  const mesh = new MeshBuilder(materialId);
  const add = (points: Point3[]) => mesh.convexFace(points);
  for (const sx of [-1, 1]) {
    add([[sx * hx, -iy, -iz], [sx * hx, iy, -iz], [sx * hx, iy, iz], [sx * hx, -iy, iz]]);
  }
  for (const sy of [-1, 1]) {
    add([[-ix, sy * hy, -iz], [ix, sy * hy, -iz], [ix, sy * hy, iz], [-ix, sy * hy, iz]]);
  }
  for (const sz of [-1, 1]) {
    add([[-ix, -iy, sz * hz], [ix, -iy, sz * hz], [ix, iy, sz * hz], [-ix, iy, sz * hz]]);
  }
  if (bevel > 0) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      add([[sx * hx, sy * iy, -iz], [sx * ix, sy * hy, -iz],
        [sx * ix, sy * hy, iz], [sx * hx, sy * iy, iz]]);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add([[sx * hx, -iy, sz * iz], [sx * ix, -iy, sz * hz],
        [sx * ix, iy, sz * hz], [sx * hx, iy, sz * iz]]);
    }
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      add([[-ix, sy * hy, sz * iz], [-ix, sy * iy, sz * hz],
        [ix, sy * iy, sz * hz], [ix, sy * hy, sz * iz]]);
    }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      add([[sx * hx, sy * iy, sz * iz],
        [sx * ix, sy * hy, sz * iz],
        [sx * ix, sy * iy, sz * hz]]);
    }
  }
  return mesh.finish();
}

/** Axis-Y faceted cylinder; topRadius allows deliberate conical frusta. */
export function facetedCylinder(
  radius: number, height: number, segments = 8, topRadius = radius, materialId = 0,
): Geometry {
  positive(radius, "Cylinder radius"); positive(topRadius, "Cylinder top radius");
  positive(height, "Cylinder height");
  subdivisions(segments, 3, 128, "Cylinder segments");
  const mesh = new MeshBuilder(materialId);
  const half = height / 2;
  const bottomCenter: Point3 = [0, -half, 0];
  const topCenter: Point3 = [0, half, 0];
  const ring = (r: number, y: number, i: number): Point3 => {
    const angle = TWO_PI * i / segments;
    return [r * Math.cos(angle), y, r * Math.sin(angle)];
  };
  for (let i = 0; i < segments; i += 1) {
    const a = ring(radius, -half, i), b = ring(radius, -half, i + 1);
    const c = ring(topRadius, half, i), d = ring(topRadius, half, i + 1);
    mesh.convexFace([a, b, d, c]);
    mesh.convexFace([topCenter, c, d]);
    mesh.convexFace([bottomCenter, b, a]);
  }
  return mesh.finish();
}

/** Pitched wedge: triangular XY section, extruded along Z. */
export function wedge(width: number, height: number, depth: number, materialId = 0): Geometry {
  positive(width, "Wedge width"); positive(height, "Wedge height"); positive(depth, "Wedge depth");
  const [x, y, z] = [width / 2, height / 2, depth / 2];
  const mesh = new MeshBuilder(materialId);
  const inside: Point3 = [-x / 3, -y / 3, 0];
  const back: Point3[] = [[-x, -y, -z], [x, -y, -z], [-x, y, -z]];
  const front: Point3[] = [[-x, -y, z], [x, -y, z], [-x, y, z]];
  mesh.convexFace(back, inside);
  mesh.convexFace(front, inside);
  for (let i = 0; i < 3; i += 1) {
    const j = (i + 1) % 3;
    mesh.convexFace([back[i]!, back[j]!, front[j]!, front[i]!], inside);
  }
  return mesh.finish();
}

export function pyramid(width: number, height: number, depth: number, materialId = 0): Geometry {
  positive(width, "Pyramid width"); positive(height, "Pyramid height"); positive(depth, "Pyramid depth");
  const [x, y, z] = [width / 2, height / 2, depth / 2];
  const mesh = new MeshBuilder(materialId);
  const base: Point3[] = [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]];
  const peak: Point3 = [0, y, 0];
  const inside: Point3 = [0, -y / 2, 0];
  mesh.convexFace(base, inside);
  for (let i = 0; i < 4; i += 1) {
    mesh.convexFace([base[i]!, base[(i + 1) % 4]!, peak], inside);
  }
  return mesh.finish();
}

/** Latitude/longitude faceted ellipsoid; explicitly triangulates nonplanar ring quads. */
export function facetedEllipsoid(
  radiusX: number, radiusY: number, radiusZ: number,
  segments = 10, latitudeBands = 5, materialId = 0,
): Geometry {
  positive(radiusX, "Ellipsoid X radius");
  positive(radiusY, "Ellipsoid Y radius");
  positive(radiusZ, "Ellipsoid Z radius");
  subdivisions(segments, 3, 128, "Ellipsoid segments");
  subdivisions(latitudeBands, 2, 64, "Ellipsoid latitude bands");
  const mesh = new MeshBuilder(materialId);
  const ring = (latitude: number, longitude: number): Point3 => {
    const theta = Math.PI * latitude / latitudeBands;
    const phi = TWO_PI * longitude / segments;
    const r = Math.sin(theta);
    return [
      radiusX * r * Math.cos(phi),
      radiusY * Math.cos(theta),
      radiusZ * r * Math.sin(phi),
    ];
  };
  const north: Point3 = [0, radiusY, 0];
  const south: Point3 = [0, -radiusY, 0];
  for (let j = 0; j < segments; j += 1) {
    mesh.convexFace([north, ring(1, j), ring(1, j + 1)]);
    for (let lat = 1; lat < latitudeBands - 1; lat += 1) {
      const a = ring(lat, j), b = ring(lat, j + 1);
      const c = ring(lat + 1, j), d = ring(lat + 1, j + 1);
      mesh.convexFace([a, c, d]);
      mesh.convexFace([a, d, b]);
    }
    mesh.convexFace([ring(latitudeBands - 1, j), south, ring(latitudeBands - 1, j + 1)]);
  }
  return mesh.finish();
}

/** Upward-facing planar disk, for shadows, pickup platforms and effects. */
export function planarDisk(radius: number, segments = 12, y = 0, materialId = 0): Geometry {
  positive(radius, "Disk radius");
  subdivisions(segments, 3, 128, "Disk segments");
  finite(y, "Disk elevation");
  const mesh = new MeshBuilder(materialId);
  for (let i = 0; i < segments; i += 1) {
    const a = TWO_PI * i / segments, b = TWO_PI * (i + 1) / segments;
    mesh.face([
      [0, y, 0],
      [radius * Math.cos(a), y, radius * Math.sin(a)],
      [radius * Math.cos(b), y, radius * Math.sin(b)],
    ], [0, 1, 0]);
  }
  return mesh.finish();
}

/**
 * Continuous, upward-facing XZ strip. The path is user-authored, not jittered.
 * Miters are limited to avoid giant spikes on abrupt bends. A near-reversal
 * is rejected (an actual roundabout must be modeled as a separate road section).
 */
export function planarRibbon(
  path: readonly PointXZ[], width: number, y = 0.02, miterLimit = 1.35, materialId = 0,
): Geometry {
  positive(width, "Ribbon width"); finite(y, "Ribbon elevation");
  if (!Number.isFinite(miterLimit) || miterLimit < 1 || miterLimit > 4) {
    throw new RangeError("Ribbon miter limit must be in [1, 4]");
  }
  if (path.length < 2 || path.length > 4096) {
    throw new RangeError("Ribbon needs 2–4096 path points");
  }
  const directions: PointXZ[] = [];
  const normals: PointXZ[] = [];
  for (const point of path) {
    if (point.length !== 2 || !point.every(Number.isFinite)) {
      throw new RangeError("Ribbon path must contain finite XZ coordinates");
    }
  }
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]!, b = path[i + 1]!;
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const segmentLength = Math.hypot(dx, dz);
    if (segmentLength <= 1e-6) throw new RangeError("Ribbon path has a zero-length segment");
    const direction: PointXZ = [dx / segmentLength, dz / segmentLength];
    directions.push(direction);
    normals.push([-direction[1], direction[0]]);
  }
  const halfWidth = width / 2;
  const left: Point3[] = [];
  const right: Point3[] = [];
  for (let i = 0; i < path.length; i += 1) {
    let nx: number, nz: number, extent = halfWidth;
    if (i === 0 || i === path.length - 1) {
      const n = normals[Math.min(i, normals.length - 1)]!;
      [nx, nz] = n;
    } else {
      const prev = directions[i - 1]!, next = directions[i]!;
      const alignment = prev[0] * next[0] + prev[1] * next[1];
      if (alignment <= -0.98) throw new RangeError("Ribbon path reverses direction too sharply");
      const p = normals[i - 1]!, n = normals[i]!;
      const sumLength = Math.hypot(p[0] + n[0], p[1] + n[1]);
      if (sumLength <= 1e-8) throw new RangeError("Ribbon miter is undefined");
      nx = (p[0] + n[0]) / sumLength;
      nz = (p[1] + n[1]) / sumLength;
      const projection = Math.max(1e-6, nx * n[0] + nz * n[1]);
      extent = Math.min(halfWidth / projection, halfWidth * miterLimit);
    }
    const [x, z] = path[i]!;
    left.push([x + nx * extent, y, z + nz * extent]);
    right.push([x - nx * extent, y, z - nz * extent]);
  }

  const mesh = new MeshBuilder(materialId);
  for (let i = 0; i < path.length - 1; i += 1) {
    mesh.face([left[i]!, right[i]!, right[i + 1]!, left[i + 1]!], [0, 1, 0]);
  }
  return mesh.finish();
}
