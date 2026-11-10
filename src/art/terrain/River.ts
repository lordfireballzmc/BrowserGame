/**
 * F2.04 — quiet faceted northern river and paired decorative wooden crossings.
 *
 * Builds once per seed: one water surface, one two-stratum riverbank mesh, and
 * one shared bridge archetype instanced at two fixed positions. The riverbed
 * is carved by Island.ts using RiverPath's same global coordinate equations.
 * Bridges are visual ONLY; no navigable combat lanes, flow sim, textures, fog,
 * bloom or GPU allocation in this module.
 */
import { bevelBox, validateGeometry, type Geometry, type Point3 } from "../mesh/Primitives";
import { combineRigidParts, type RigidPart } from "../models/Archetypes";
import { terrainHeight, signedCoast } from "./Island";
import { RIVER_SPEC, riverCenterZ, riverHalfWidth, riverOuterBankWidth } from "./RiverPath";
import { MATERIAL_TOKENS, type MaterialToken } from "../../engine/render/Palette";
import { seedToUint32 } from "../../game/Random";

export interface NorthernRiver {
  readonly seed: number;
  readonly water: Geometry;
  readonly banks: Geometry;
  readonly bridge: Geometry;
  /** Two fixed visual-only placements; no hero/enemy navigation edge. */
  readonly bridgePositions: readonly Point3[];
  readonly segments: number;
}

const slot = (name: MaterialToken) => MATERIAL_TOKENS.indexOf(name) + 1;
const WATER_SLOT = slot("water");
const EARTH_SLOT = slot("earth.cut");
const ROCK_SLOT = slot("stone.shadow");

class FacetStrip {
  private readonly positions: number[] = [];
  private readonly normals: number[] = [];
  private readonly indices: number[] = [];
  private readonly materialIds: number[] = [];

  triangle(a: Point3, b: Point3, c: Point3, material: number): void {
    const ab: Point3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac: Point3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let normal: Point3 = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const length = Math.hypot(...normal);
    if (length <= 1e-10) throw new Error("Degenerate river surface triangle");
    let second = b, third = c;
    if (normal[1] < 0) {
      second = c;
      third = b;
      normal = [-normal[0], -normal[1], -normal[2]];
    }
    const base = this.positions.length / 3;
    for (const p of [a, second, third]) {
      this.positions.push(...p);
      this.normals.push(normal[0] / length, normal[1] / length, normal[2] / length);
      this.materialIds.push(material);
    }
    this.indices.push(base, base + 1, base + 2);
  }

  quad(a: Point3, b: Point3, c: Point3, d: Point3, material: number): void {
    this.triangle(a, b, c, material);
    this.triangle(a, c, d, material);
  }

  finish(): Geometry {
    const positions = new Float32Array(this.positions);
    if (!positions.length) throw new Error("Empty river strip");
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis]!, positions[i + axis]!);
        max[axis] = Math.max(max[axis]!, positions[i + axis]!);
      }
    }
    const result: Geometry = {
      positions,
      normals: new Float32Array(this.normals),
      materialIds: new Uint8Array(this.materialIds),
      indices: positions.length / 3 <= 65535
        ? new Uint16Array(this.indices) : new Uint32Array(this.indices),
      bounds: {
        min: [min[0]!, min[1]!, min[2]!],
        max: [max[0]!, max[1]!, max[2]!],
      },
    };
    validateGeometry(result);
    return result;
  }
}

function bridgeGeometry(): Geometry {
  const pieces: RigidPart[] = [];
  const add = (
    name: string, parent: string | null, width: number, height: number,
    depth: number, bevel: number, material: MaterialToken, position: Point3,
  ) => {
    pieces.push({
      name, parent, geometry: bevelBox(width, height, depth, bevel),
      material, position, pivot: position,
    });
  };
  // Nine separate hand-laid plank tops, with subtle real gaps between them.
  add("deck-frame", null, 2.45, 0.18, 6.3, 0.045, "timber.base", [0, 0.13, 0]);
  for (let i = 0; i < 9; i++) {
    add("deck-plank-" + i, "deck-frame", 2.60, 0.10, 0.62, 0.022,
      i % 3 === 0 ? "timber.light" : "timber.base", [0, 0.27, -2.78 + i * 0.695]);
  }
  for (const side of [-1, 1]) {
    add("handrail-" + side, "deck-frame", 0.12, 0.13, 5.95, 0.025,
      "timber.light", [side * 1.24, 0.92, 0]);
    for (const z of [-2.55, 0, 2.55]) {
      add("post-" + side + "-" + z, "deck-frame", 0.16, 0.83, 0.16, 0.03,
        "timber.base", [side * 1.24, 0.49, z]);
    }
  }
  return combineRigidParts(pieces);
}

const cache = new Map<number, NorthernRiver>();
let cachedBridge: Geometry | null = null;

export function generateNorthernRiver(seed: number | string): NorthernRiver {
  const versionedSeed = seedToUint32(seed);
  const previous = cache.get(versionedSeed);
  if (previous) return previous;

  const water = new FacetStrip();
  const banks = new FacetStrip();
  const segments = Math.round((RIVER_SPEC.endX - RIVER_SPEC.startX) / RIVER_SPEC.sampleStepMeters);

  const point = (x: number, side: -1 | 1) => {
    const center = riverCenterZ(x);
    const inner = riverHalfWidth(x), outer = riverOuterBankWidth(x);
    const zInner = center + side * inner;
    const zOuter = center + side * outer;
    // Upper bank joins local sampled terrain; lower rock disappears beneath
    // the water line. Explicit bands avoid noisy per-triangle color teeth.
    return {
      inner: [x, RIVER_SPEC.waterHeightMeters - 0.025, zInner] as Point3,
      middle: [x, -0.095, center + side * (inner + (outer - inner) * 0.55)] as Point3,
      outer: [x, terrainHeight(versionedSeed, x, zOuter) + 0.015, zOuter] as Point3,
      water: [x, RIVER_SPEC.waterHeightMeters, zInner] as Point3,
    };
  };

  for (let i = 0; i < segments; i++) {
    const a = RIVER_SPEC.startX + i * RIVER_SPEC.sampleStepMeters;
    const b = i === segments - 1
      ? RIVER_SPEC.endX : RIVER_SPEC.startX + (i + 1) * RIVER_SPEC.sampleStepMeters;
    const s0 = point(a, -1), n0 = point(a, 1);
    const s1 = point(b, -1), n1 = point(b, 1);
    water.quad(s0.water, s1.water, n1.water, n0.water, WATER_SLOT);
    for (const [p, q] of [[s0, s1], [n0, n1]]) {
      banks.quad(p.outer, q.outer, q.middle, p.middle, EARTH_SLOT);
      banks.quad(p.middle, q.middle, q.inner, p.inner, ROCK_SLOT);
    }
  }
  if (!cachedBridge) cachedBridge = bridgeGeometry();
  const bridgePositions: readonly Point3[] = Object.freeze(RIVER_SPEC.bridgeXs.map(x =>
    Object.freeze([x, 0, riverCenterZ(x)] as Point3)));
  const result: NorthernRiver = Object.freeze({
    seed: versionedSeed,
    water: water.finish(), banks: banks.finish(), bridge: cachedBridge,
    bridgePositions, segments,
  });
  // Strong semantic invariant: every water and bank vertex is inside the island.
  for (const geometry of [result.water, result.banks]) {
    for (let i = 0; i < geometry.positions.length; i += 3) {
      if (signedCoast(geometry.positions[i]!, geometry.positions[i + 2]!) >= 0) {
        throw new Error("Northern river geometry crosses the island coast");
      }
    }
  }
  if (cache.size >= 3) cache.delete(cache.keys().next().value!);
  cache.set(versionedSeed, result);
  return result;
}
