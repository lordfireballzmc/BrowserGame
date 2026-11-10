import { describe, expect, it } from "vitest";
import {
  ROAD_SPEC, ROAD_WAYPOINTS, ROAD_SAMPLES, ROAD_LENGTH_METERS,
  roadPointAtDistance, nearestRoadPoint, distanceToRoadXZ,
} from "../src/art/terrain/RoadPath";
import { createAuthoredRoad, isInsideRoadLane } from "../src/art/terrain/Road";
import { generateTerrain, signedCoast, terrainHeight, TERRAIN_SPEC } from "../src/art/terrain/Island";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { MATERIAL_TOKENS } from "../src/engine/render/Palette";

describe("F2.02 fixed 4.5m authored collision lane", () => {
  it("joins the precise enemy-entry and keep coordinates, with nontrivial winding", () => {
    expect(ROAD_WAYPOINTS.length).toBeGreaterThanOrEqual(6);
    expect(ROAD_SAMPLES[0]!.x).toBeCloseTo(-34, 9);
    expect(ROAD_SAMPLES[0]!.z).toBeCloseTo(-5, 9);
    expect(ROAD_SAMPLES.at(-1)!.x).toBeCloseTo(31, 9);
    expect(ROAD_SAMPLES.at(-1)!.z).toBeCloseTo(2, 9);
    const zs = ROAD_SAMPLES.map(p => p.z);
    expect(Math.min(...zs)).toBeLessThan(-6.5);
    expect(Math.max(...zs)).toBeGreaterThan(6);
    expect(ROAD_LENGTH_METERS).toBeGreaterThan(65);
    expect(ROAD_LENGTH_METERS).toBeLessThan(120);
  });

  it("samples one C1 cubic spline at no more than 0.55m planar chord length", () => {
    expect(ROAD_SAMPLES.length).toBeGreaterThan(100);
    for (let i = 1; i < ROAD_SAMPLES.length; i++) {
      const a = ROAD_SAMPLES[i - 1]!, b = ROAD_SAMPLES[i]!;
      const chord = Math.hypot(b.x - a.x, b.z - a.z);
      expect(chord).toBeGreaterThan(0.01);
      expect(chord).toBeLessThanOrEqual(ROAD_SPEC.maxSampleStepMeters + 1e-7);
      expect(b.distance).toBeGreaterThan(a.distance);
      expect(Math.abs(Math.hypot(...b.tangent) - 1)).toBeLessThan(1e-8);
      if (i > 1) {
        const p = ROAD_SAMPLES[i - 2]!;
        const d1 = Math.atan2(a.z - p.z, a.x - p.x);
        const d2 = Math.atan2(b.z - a.z, b.x - a.x);
        const turn = Math.atan2(Math.sin(d2 - d1), Math.cos(d2 - d1));
        expect(Math.abs(turn)).toBeLessThan(0.15);
      }
    }
  });

  it("stays inside the rounded island, with both road edges clipped to land", () => {
    const road = createAuthoredRoad();
    for (const sample of road.crossSections) {
      for (const vertex of [sample.center, sample.left, sample.right]) {
        expect(signedCoast(vertex[0], vertex[2])).toBeLessThan(-0.000001);
        expect(Math.abs(vertex[0])).toBeLessThanOrEqual(TERRAIN_SPEC.widthMeters / 2);
        expect(Math.abs(vertex[2])).toBeLessThanOrEqual(TERRAIN_SPEC.depthMeters / 2);
      }
    }
  });

  it("maintains exactly 4.5m cross-sections and <=1.35x miter bound", () => {
    const road = createAuthoredRoad();
    expect(road.sampleStepMaxMeters).toBeLessThanOrEqual(0.55 + 1e-6);
    expect(road.lengthMeters).toBe(ROAD_LENGTH_METERS);
    expect(road.crossSections.length).toBe(ROAD_SAMPLES.length);
    for (const section of road.crossSections) {
      expect(section.widthMeters).toBeCloseTo(ROAD_SPEC.widthMeters, 7);
      expect(section.widthMeters).toBeLessThanOrEqual(ROAD_SPEC.widthMeters * ROAD_SPEC.miterLimit);
      const midX = (section.left[0] + section.right[0]) / 2;
      const midZ = (section.left[2] + section.right[2]) / 2;
      expect(midX).toBeCloseTo(section.center[0], 8);
      expect(midZ).toBeCloseTo(section.center[2], 8);
    }
  });

  it("exposes arc-length sampling that clamps at endpoints and is monotone", () => {
    const start = roadPointAtDistance(-100);
    const end = roadPointAtDistance(ROAD_LENGTH_METERS + 100);
    expect([start.x, start.z]).toEqual([...ROAD_SPEC.entrance]);
    expect([end.x, end.z]).toEqual([...ROAD_SPEC.destination]);
    let lastX = -Infinity;
    for (let d = 0; d <= ROAD_LENGTH_METERS; d += 0.8) {
      const p = roadPointAtDistance(d);
      expect(p.x).toBeGreaterThan(lastX);
      lastX = p.x;
      expect(nearestRoadPoint(p.x, p.z).lateralDistance).toBeLessThan(0.01);
    }
  });

  it("answers collision queries at center, shoulders, and radius-reduced boundaries", () => {
    const middle = roadPointAtDistance(ROAD_LENGTH_METERS * 0.45);
    const nx = -middle.tangent[1], nz = middle.tangent[0];
    expect(isInsideRoadLane(middle.x, middle.z)).toBe(true);
    expect(isInsideRoadLane(middle.x + nx * 2.1, middle.z + nz * 2.1)).toBe(true);
    expect(isInsideRoadLane(middle.x + nx * 2.5, middle.z + nz * 2.5)).toBe(false);
    expect(isInsideRoadLane(middle.x + nx * 1.6, middle.z + nz * 1.6, 0.55)).toBe(true);
    expect(isInsideRoadLane(middle.x + nx * 2.0, middle.z + nz * 2.0, 0.55)).toBe(false);
    const left = nearestRoadPoint(middle.x + nx * 1.3, middle.z + nz * 1.3);
    const right = nearestRoadPoint(middle.x - nx * 1.3, middle.z - nz * 1.3);
    expect(left.signedLateralMeters).toBeGreaterThan(0);
    expect(right.signedLateralMeters).toBeLessThan(0);
    expect(left.distance).toBeGreaterThan(0);
  });

  it("makes every lane path surface canonical y=0 and meshes road 0.04m above it", () => {
    const seed = "fenwall-crossing-v1";
    for (let i = 1; i < ROAD_SAMPLES.length - 1; i += 5) {
      const point = ROAD_SAMPLES[i]!;
      const nx = -point.tangent[1], nz = point.tangent[0];
      for (const offset of [-2.25, -1.1, 0, 1.1, 2.25]) {
        expect(terrainHeight(seed, point.x + nx * offset, point.z + nz * offset)).toBe(0);
      }
    }
    const road = createAuthoredRoad();
    for (const section of road.crossSections) {
      expect(section.center[1]).toBeCloseTo(0.04, 9);
      expect(section.left[1]).toBeCloseTo(0.04, 9);
      expect(section.right[1]).toBeCloseTo(0.04, 9);
    }
  });

  it("blends the road cut smoothly back into seeded terrain on outer shoulders", () => {
    const seed = "fenwall-crossing-v1";
    const middle = roadPointAtDistance(ROAD_LENGTH_METERS / 2);
    const nx = -middle.tangent[1], nz = middle.tangent[0];
    const cut = terrainHeight(seed,
      middle.x + nx * ROAD_SPEC.flatTerrainHalfWidthMeters,
      middle.z + nz * ROAD_SPEC.flatTerrainHalfWidthMeters);
    expect(cut).toBe(0);
    const feather = terrainHeight(seed, middle.x + nx * 4.5, middle.z + nz * 4.5);
    const outside = terrainHeight(seed, middle.x + nx * 7, middle.z + nz * 7);
    expect(Math.abs(feather)).toBeLessThanOrEqual(0.4);
    expect(Math.abs(outside)).toBeLessThanOrEqual(0.4);
  });

  it("generates an indexed, validated single-mesh road with two semantic palette slots", () => {
    const road = createAuthoredRoad();
    expect(() => validateGeometry(road.surface)).not.toThrow();
    expect(road.surface.indices.length / 3).toBeGreaterThan(ROAD_SAMPLES.length * 2);
    expect(road.surface.bounds.min[1]).toBeCloseTo(0.04, 5);
    expect(road.surface.bounds.max[1]).toBeCloseTo(0.052, 5);
    const primary = MATERIAL_TOKENS.indexOf("road.primary") + 1;
    const rut = MATERIAL_TOKENS.indexOf("road.rut") + 1;
    expect(new Set(road.surface.materialIds)).toEqual(new Set([primary, rut]));
    expect(road.rutCount).toBeGreaterThan(10);
    expect(road.rutCount).toBeLessThan(40);
  });

  it("keeps wagon rut dashes more than 3m apart and in navigable shoulders", () => {
    const road = createAuthoredRoad();
    let previous = -Infinity;
    let seen = 0;
    for (let start = 3.5; start + 1.5 < ROAD_LENGTH_METERS - 2; start += 3.5) {
      expect(start - previous).toBeGreaterThanOrEqual(3);
      previous = start;
      seen++;
    }
    expect(road.rutCount).toBe(seen);
  });

  it("keeps seeded tile seams exact after introducing terrain corridor carving", () => {
    const island = generateTerrain("fenwall-crossing-v1");
    const get = (col: number, row: number) => island.tiles[row * 9 + col]!;
    for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
      const tile = get(col, row);
      if (col < 8) {
        const next = get(col + 1, row);
        for (let j = 0; j <= 8; j++) expect(tile.samples[j * 9 + 8]).toBe(next.samples[j * 9]);
      }
      if (row < 5) {
        const next = get(col, row + 1);
        for (let i = 0; i <= 8; i++) expect(tile.samples[8 * 9 + i]).toBe(next.samples[i]);
      }
    }
  });

  it("is deterministic and rejects invalid position/distance/radius input", () => {
    expect(createAuthoredRoad()).toBe(createAuthoredRoad());
    const road = createAuthoredRoad();
    expect(road.surface.positions).toEqual(createAuthoredRoad().surface.positions);
    expect(distanceToRoadXZ(0, 0)).toBe(nearestRoadPoint(0, 0).lateralDistance);
    expect(() => nearestRoadPoint(NaN, 0)).toThrow(RangeError);
    expect(() => nearestRoadPoint(0, Infinity)).toThrow(RangeError);
    expect(() => roadPointAtDistance(NaN)).toThrow(RangeError);
    expect(() => isInsideRoadLane(0, 0, -1)).toThrow(RangeError);
    expect(() => isInsideRoadLane(0, 0, 3)).toThrow(RangeError);
  });
});
