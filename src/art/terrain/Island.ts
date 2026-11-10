/**
 * F2.01 — Fenwall Crossing's deterministic, tiled 72 × 48 m island.
 *
 * Every 8 × 8 m tile uses 1 m world-lattice samples, computed solely from
 * global coordinates and the versioned seed. The convex superellipse coastline
 * clips the original cell triangles rather than drawing an opaque rectangle.
 * At its exposed edges a stratified 1–4 m stone skirt is extruded downward.
 *
 * All meshes follow F1.03's flat CCW/typed indexed mesh contract and use only
 * canonical material slots. No Math.random, textures, GPU allocations or game
 * state mutations. Road, props, and river geometry belong to later F2 tasks.
 */
import { seedToUint32 } from "../../game/Random";
import type { Geometry, Point3 } from "../mesh/Primitives";
import { validateGeometry } from "../mesh/Primitives";
import { MATERIAL_TOKENS, type MaterialToken } from "../../engine/render/Palette";

export const TERRAIN_SPEC = {
  widthMeters: 72,
  depthMeters: 48,
  tileMeters: 8,
  sampleMeters: 1,
  tilesX: 9,
  tilesZ: 6,
  coastExponent: 8,
  minimumCliffMeters: 1.6,
  maximumCliffMeters: 3.5,
} as const;

export interface TerrainTile {
  readonly column: number;
  readonly row: number;
  readonly originX: number;
  readonly originZ: number;
  /** 9×9 row-major lattice. Includes samples outside the clipped coastline. */
  readonly samples: Float32Array;
  readonly surface: Geometry;
  /** Null for tiles wholly inside the island; otherwise an exterior rock wall. */
  readonly cliff: Geometry | null;
  readonly coastSegments: number;
}

export interface TerrainIsland {
  readonly seed: number;
  readonly tiles: readonly TerrainTile[];
  readonly coastSegments: number;
  readonly bounds: Readonly<{ width: number; depth: number }>;
}

interface LandVertex {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  /** Negative inside, zero at the coast, positive outside. */
  readonly signed: number;
}

const HALF_WIDTH = TERRAIN_SPEC.widthMeters / 2;
const HALF_DEPTH = TERRAIN_SPEC.depthMeters / 2;
const GRID = TERRAIN_SPEC.tileMeters / TERRAIN_SPEC.sampleMeters;
const GRID_ROW = GRID + 1;
const FACE_EPS = 1e-10;
const COAST_EPS = 1e-9;
const SLOT = (name: MaterialToken): number => MATERIAL_TOKENS.indexOf(name) + 1;
const SLOTS = {
  grass: SLOT("grass.primary"),
  shade: SLOT("grass.shadow"),
  dry: SLOT("grass.dry"),
  earth: SLOT("earth.cut"),
  stone: SLOT("stone.shadow"),
};

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Coordinate-hashed value noise: independent of tile generation or iteration order. */
function hashValue(seed: number, gx: number, gz: number): number {
  let h = seed ^ Math.imul(gx, 0x27d4eb2d) ^ Math.imul(gz, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 0xffff_ffff * 2 - 1;
}

function valueNoise(seed: number, x: number, z: number, period: number): number {
  const a = x / period, b = z / period;
  const gx = Math.floor(a), gz = Math.floor(b);
  const tx = smooth(a - gx), tz = smooth(b - gz);
  const bottom = hashValue(seed, gx, gz) * (1 - tx)
    + hashValue(seed, gx + 1, gz) * tx;
  const top = hashValue(seed, gx, gz + 1) * (1 - tx)
    + hashValue(seed, gx + 1, gz + 1) * tx;
  return bottom * (1 - tz) + top * tz;
}

/** Island footprint is a rounded rectangle that genuinely clips corner cells. */
export function signedCoast(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    throw new RangeError("Coast coordinates must be finite");
  }
  return (Math.abs(x) / HALF_WIDTH) ** TERRAIN_SPEC.coastExponent
    + (Math.abs(z) / HALF_DEPTH) ** TERRAIN_SPEC.coastExponent - 1;
}

/** Unclipped sampled elevation; hero spawn/core staging zones remain at y=0. */
export function terrainHeight(seed: number | string, x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    throw new RangeError("Height sample coordinates must be finite");
  }
  const s = seedToUint32(seed);
  const distanceToAnchor = Math.min(Math.hypot(x - 31, z - 2), Math.hypot(x + 34, z + 5));
  const flatten = smooth(clamp01((distanceToAnchor - 2.5) / 3.5));
  const relief = 0.24 * valueNoise(s, x, z, 9)
    + 0.095 * valueNoise(s ^ 0xa5c31e2b, x, z, 3.5);
  return Math.fround(relief * flatten);
}

/** Deterministic 1.6–3.5m cliff reveal, sampled at world coordinates. */
export function cliffDrop(seed: number | string, x: number, z: number): number {
  const noise = valueNoise(seedToUint32(seed) ^ 0x7a2de340, x, z, 11);
  return 2.55 + noise * 0.95;
}

function vertex(seed: number, x: number, z: number): LandVertex {
  return { x, z, y: terrainHeight(seed, x, z), signed: signedCoast(x, z) };
}

/**
 * Calculate intersection from lexically ordered *global* edge endpoints.
 * This ensures two independently generated tile edges produce identical
 * float32 crossing coordinates and heights, even if traversed in reverse.
 */
function intersection(a: LandVertex, b: LandVertex): LandVertex {
  const first = a.x < b.x || (a.x === b.x && a.z <= b.z) ? a : b;
  const second = first === a ? b : a;
  if (Math.abs(first.signed) < COAST_EPS) return first;
  if (Math.abs(second.signed) < COAST_EPS) return second;
  const ratio = first.signed / (first.signed - second.signed);
  return {
    x: Math.fround(first.x + (second.x - first.x) * ratio),
    z: Math.fround(first.z + (second.z - first.z) * ratio),
    y: Math.fround(first.y + (second.y - first.y) * ratio),
    signed: 0,
  };
}

function clippedTriangle(triangle: readonly LandVertex[]): LandVertex[] {
  const result: LandVertex[] = [];
  for (let i = 0; i < triangle.length; i++) {
    const a = triangle[i]!, b = triangle[(i + 1) % triangle.length]!;
    const insideA = a.signed <= COAST_EPS;
    const insideB = b.signed <= COAST_EPS;
    if (insideA && insideB) result.push(b);
    else if (insideA && !insideB) result.push(intersection(a, b));
    else if (!insideA && insideB) result.push(intersection(a, b), b);
  }
  // Discard duplicate co-located vertices introduced at exact coast points.
  return result.filter((point, i) => {
    const next = result[(i + 1) % result.length];
    return next && Math.hypot(point.x - next.x, point.z - next.z) > 1e-7;
  });
}

function cross(a: Point3, b: Point3): Point3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

class FlatGeometryBuilder {
  private positions: number[] = [];
  private normals: number[] = [];
  private indices: number[] = [];
  private slots: number[] = [];

  add(a: Point3, b: Point3, c: Point3, expected: Point3, slot: number): void {
    let n = cross(
      [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      [c[0] - a[0], c[1] - a[1], c[2] - a[2]],
    );
    const magnitude = Math.hypot(...n);
    if (magnitude <= FACE_EPS) return;
    if (!Number.isInteger(slot) || slot <= 0 || slot > MATERIAL_TOKENS.length) {
      throw new RangeError("Terrain uses an undefined semantic material");
    }
    let second = b, third = c;
    if (n[0] * expected[0] + n[1] * expected[1] + n[2] * expected[2] < 0) {
      second = c;
      third = b;
      n = [-n[0], -n[1], -n[2]];
    }
    const start = this.positions.length / 3;
    for (const p of [a, second, third]) {
      this.positions.push(...p);
      this.normals.push(n[0] / magnitude, n[1] / magnitude, n[2] / magnitude);
      this.slots.push(slot);
    }
    this.indices.push(start, start + 1, start + 2);
  }

  finish(): Geometry | null {
    if (!this.positions.length) return null;
    const positions = new Float32Array(this.positions);
    const min: number[] = [Infinity, Infinity, Infinity];
    const max: number[] = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        const value = positions[i + axis]!;
        min[axis] = Math.min(min[axis]!, value);
        max[axis] = Math.max(max[axis]!, value);
      }
    }
    const geometry: Geometry = {
      positions,
      normals: new Float32Array(this.normals),
      materialIds: new Uint8Array(this.slots),
      indices: positions.length / 3 <= 65_535
        ? new Uint16Array(this.indices) : new Uint32Array(this.indices),
      bounds: {
        min: [min[0]!, min[1]!, min[2]!],
        max: [max[0]!, max[1]!, max[2]!],
      },
    };
    validateGeometry(geometry);
    return geometry;
  }
}

function coastNormal(x: number, z: number): Point3 {
  const d = TERRAIN_SPEC.coastExponent - 1;
  const dx = Math.sign(x) * (Math.abs(x) / HALF_WIDTH) ** d / HALF_WIDTH;
  const dz = Math.sign(z) * (Math.abs(z) / HALF_DEPTH) ** d / HALF_DEPTH;
  return [dx, 0, dz];
}

function buildTile(seed: number, column: number, row: number): TerrainTile {
  const originX = -HALF_WIDTH + column * TERRAIN_SPEC.tileMeters;
  const originZ = -HALF_DEPTH + row * TERRAIN_SPEC.tileMeters;
  const samples = new Float32Array(GRID_ROW * GRID_ROW);
  const corners: LandVertex[][] = [];
  for (let j = 0; j <= GRID; j++) {
    const line: LandVertex[] = [];
    for (let i = 0; i <= GRID; i++) {
      const point = vertex(seed, originX + i, originZ + j);
      line.push(point);
      samples[j * GRID_ROW + i] = point.y;
    }
    corners.push(line);
  }

  const ground = new FlatGeometryBuilder();
  const rock = new FlatGeometryBuilder();
  let coastSegments = 0;

  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const a = corners[j]![i]!;
      const b = corners[j]![i + 1]!;
      const c = corners[j + 1]![i + 1]!;
      const d = corners[j + 1]![i]!;
      // Fixed global cell diagonal. Triangles wind upward (+Y).
      for (const triangle of [[a, d, b], [b, d, c]]) {
        const polygon = clippedTriangle(triangle);
        if (polygon.length < 3) continue;
        for (let p = 1; p < polygon.length - 1; p++) {
          const aa = polygon[0]!, bb = polygon[p]!, cc = polygon[p + 1]!;
          const midX = (aa.x + bb.x + cc.x) / 3;
          const midZ = (aa.z + bb.z + cc.z) / 3;
          const steepness = Math.max(
            Math.abs(aa.y - bb.y), Math.abs(bb.y - cc.y), Math.abs(cc.y - aa.y),
          );
          const slot = signedCoast(midX, midZ) > -0.12 ? SLOTS.dry
            : steepness > 0.16 ? SLOTS.shade : SLOTS.grass;
          ground.add(
            [aa.x, aa.y, aa.z], [bb.x, bb.y, bb.z], [cc.x, cc.y, cc.z],
            [0, 1, 0], slot,
          );
        }

        // The clipped polygon's new two-boundary-vertex edges trace the island.
        for (let p = 0; p < polygon.length; p++) {
          const aa = polygon[p]!, bb = polygon[(p + 1) % polygon.length]!;
          if (Math.abs(aa.signed) > COAST_EPS || Math.abs(bb.signed) > COAST_EPS
            || Math.hypot(aa.x - bb.x, aa.z - bb.z) < 1e-7) continue;
          const expected = coastNormal((aa.x + bb.x) / 2, (aa.z + bb.z) / 2);
          const bottomA = aa.y - cliffDrop(seed, aa.x, aa.z);
          const bottomB = bb.y - cliffDrop(seed, bb.x, bb.z);
          // 40% exposed earth cut, 60% darker rock stratum.
          const bandA = aa.y * 0.6 + bottomA * 0.4;
          const bandB = bb.y * 0.6 + bottomB * 0.4;
          const topA: Point3 = [aa.x, aa.y, aa.z];
          const topB: Point3 = [bb.x, bb.y, bb.z];
          const middleA: Point3 = [aa.x, bandA, aa.z];
          const middleB: Point3 = [bb.x, bandB, bb.z];
          const lowA: Point3 = [aa.x, bottomA, aa.z];
          const lowB: Point3 = [bb.x, bottomB, bb.z];
          rock.add(topA, middleA, topB, expected, SLOTS.earth);
          rock.add(topB, middleA, middleB, expected, SLOTS.earth);
          rock.add(middleA, lowA, middleB, expected, SLOTS.stone);
          rock.add(middleB, lowA, lowB, expected, SLOTS.stone);
          coastSegments++;
        }
      }
    }
  }

  const surface = ground.finish();
  if (!surface) throw new Error("A configured terrain tile has no land");
  return {
    column, row, originX, originZ, samples, surface,
    cliff: rock.finish(), coastSegments,
  };
}

const cache = new Map<number, TerrainIsland>();

/** Reuses exactly one set of CPU mesh buffers for each recent map seed. */
export function generateTerrain(seed: number | string): TerrainIsland {
  const versionedSeed = seedToUint32(seed);
  const previous = cache.get(versionedSeed);
  if (previous) return previous;
  const tiles: TerrainTile[] = [];
  let coastSegments = 0;
  for (let row = 0; row < TERRAIN_SPEC.tilesZ; row++) {
    for (let column = 0; column < TERRAIN_SPEC.tilesX; column++) {
      const tile = buildTile(versionedSeed, column, row);
      tiles.push(tile);
      coastSegments += tile.coastSegments;
    }
  }
  const island: TerrainIsland = {
    seed: versionedSeed, tiles, coastSegments,
    bounds: { width: TERRAIN_SPEC.widthMeters, depth: TERRAIN_SPEC.depthMeters },
  };
  // Small bounded cache; changing seeds cannot grow CPU mesh memory indefinitely.
  if (cache.size >= 3) cache.delete(cache.keys().next().value!);
  cache.set(versionedSeed, island);
  return island;
}
