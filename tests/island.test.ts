import { describe, expect, it } from "vitest";
import {
  TERRAIN_SPEC, cliffDrop, generateTerrain, signedCoast, terrainHeight,
  type TerrainTile,
} from "../src/art/terrain/Island";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { MATERIAL_TOKENS, type MaterialToken } from "../src/engine/render/Palette";

const seed = "fenwall-crossing-v1";
const world = generateTerrain(seed);
const getTile = (col: number, row: number): TerrainTile =>
  world.tiles[row * TERRAIN_SPEC.tilesX + col]!;

function borderVertices(tile: TerrainTile, axis: 0 | 2, value: number): string[] {
  const vertices = new Set<string>();
  const data = tile.surface.positions;
  for (let i = 0; i < data.length; i += 3) {
    if (Math.abs(data[i + axis]! - value) > 0.000005) continue;
    const a = axis === 0 ? data[i + 2]! : data[i]!;
    vertices.add(String(Math.round(a * 1e5)) + ":" + String(Math.round(data[i + 1]! * 1e5)));
  }
  return [...vertices].sort();
}

describe("F2.01: seeded 72 x 48 m island terrain", () => {
  it("constructs all 54 tiles, in deterministic row-major world coordinates", () => {
    expect(world.bounds).toEqual({ width: 72, depth: 48 });
    expect(TERRAIN_SPEC.tileMeters).toBe(8);
    expect(TERRAIN_SPEC.sampleMeters).toBe(1);
    expect(world.tiles).toHaveLength(9 * 6);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
      const tile = getTile(col, row);
      expect(tile.column).toBe(col);
      expect(tile.row).toBe(row);
      expect(tile.originX).toBe(-36 + col * 8);
      expect(tile.originZ).toBe(-24 + row * 8);
      expect(tile.samples).toHaveLength(81);
      expect(() => validateGeometry(tile.surface)).not.toThrow();
      if (tile.cliff) expect(() => validateGeometry(tile.cliff!)).not.toThrow();
    }
  });

  it("makes exact shared 1 m sample heights on horizontal and vertical tile seams", () => {
    for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
      const here = getTile(col, row);
      if (col < 8) {
        const east = getTile(col + 1, row);
        for (let j = 0; j <= 8; j++) {
          expect(here.samples[j * 9 + 8]).toBe(east.samples[j * 9]);
        }
      }
      if (row < 5) {
        const north = getTile(col, row + 1);
        for (let i = 0; i <= 8; i++) {
          expect(here.samples[8 * 9 + i]).toBe(north.samples[i]);
        }
      }
    }
  });

  it("matches actual clipped surface mesh vertices on every neighboring tile seam", () => {
    for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) {
      const here = getTile(col, row);
      if (col < 8) {
        const atX = here.originX + 8;
        expect(borderVertices(here, 0, atX)).toEqual(borderVertices(getTile(col + 1, row), 0, atX));
      }
      if (row < 5) {
        const atZ = here.originZ + 8;
        expect(borderVertices(here, 2, atZ)).toEqual(borderVertices(getTile(col, row + 1), 2, atZ));
      }
    }
  });

  it("keeps every surface vertex inside the clipped superellipse footprint", () => {
    let vertices = 0;
    for (const tile of world.tiles) {
      for (let i = 0; i < tile.surface.positions.length; i += 3) {
        const x = tile.surface.positions[i]!, z = tile.surface.positions[i + 2]!;
        expect(Math.abs(x)).toBeLessThanOrEqual(36);
        expect(Math.abs(z)).toBeLessThanOrEqual(24);
        expect(signedCoast(x, z)).toBeLessThan(0.000002);
        vertices++;
      }
    }
    expect(vertices).toBeGreaterThan(10_000);
    expect(signedCoast(36, 24)).toBeGreaterThan(0);
    expect(signedCoast(-34, -5)).toBeLessThan(0);
    expect(signedCoast(31, 2)).toBeLessThan(0);
  });

  it("builds a visible two-material 1.6–3.5m rock stratum along the coast", () => {
    const earth = MATERIAL_TOKENS.indexOf("earth.cut") + 1;
    const stone = MATERIAL_TOKENS.indexOf("stone.shadow") + 1;
    const exposed = world.tiles.filter(tile => tile.cliff !== null);
    expect(exposed.length).toBeGreaterThan(10);
    expect(exposed.length).toBeLessThan(54);
    expect(world.coastSegments).toBeGreaterThan(50);
    expect(exposed.reduce((sum, tile) => sum + tile.coastSegments, 0))
      .toBe(world.coastSegments);
    for (const tile of exposed) {
      const ids = new Set(tile.cliff!.materialIds);
      expect(ids.has(earth)).toBe(true);
      expect(ids.has(stone)).toBe(true);
      expect(tile.cliff!.bounds.min[1]).toBeGreaterThan(-3.9);
    }
    for (let z = -24; z <= 24; z += 6) {
      expect(cliffDrop(seed, 0, z)).toBeGreaterThanOrEqual(1.6);
      expect(cliffDrop(seed, 0, z)).toBeLessThanOrEqual(3.5);
    }
  });

  it("limits consecutive 1m lattice slopes to less than the 0.65m budget", () => {
    for (const tile of world.tiles) {
      for (let z = 0; z <= 8; z++) for (let x = 0; x <= 8; x++) {
        const h = tile.samples[z * 9 + x]!;
        if (x < 8) expect(Math.abs(h - tile.samples[z * 9 + x + 1]!)).toBeLessThan(0.65);
        if (z < 8) expect(Math.abs(h - tile.samples[(z + 1) * 9 + x]!)).toBeLessThan(0.65);
      }
    }
  });

  it("keeps guaranteed core and enemy-entry ground staging positions flat", () => {
    expect(terrainHeight(seed, 31, 2)).toBe(0);
    expect(terrainHeight(seed, -34, -5)).toBe(0);
    expect(Math.abs(terrainHeight(seed, 0, 0))).toBeLessThan(0.4);
  });

  it("is stable by seed and independent of how many worlds are generated", () => {
    expect(generateTerrain(seed)).toBe(world);
    const different = generateTerrain("fenwall-crossing-v2");
    expect(different.seed).not.toBe(world.seed);
    expect(different.tiles[25]?.surface.positions).not.toEqual(world.tiles[25]?.surface.positions);
    expect(generateTerrain(seed)).toBe(world);
  });

  it("produces only finite normalized normals and permitted material slots", () => {
    const allowed: MaterialToken[] = [
      "grass.primary", "grass.shadow", "grass.dry", "earth.cut", "stone.shadow",
    ];
    const expected = new Set(allowed.map(name => MATERIAL_TOKENS.indexOf(name) + 1));
    for (const tile of world.tiles) for (const mesh of [tile.surface, tile.cliff]) {
      if (!mesh) continue;
      expect(mesh.positions.length).toBe(mesh.normals.length);
      expect(mesh.indices.length % 3).toBe(0);
      expect([...mesh.materialIds].every(id => expected.has(id))).toBe(true);
      for (const normal of mesh.normals) expect(Number.isFinite(normal)).toBe(true);
    }
  });

  it("rejects invalid world coordinates and seeds", () => {
    expect(() => terrainHeight(seed, Infinity, 0)).toThrow(RangeError);
    expect(() => terrainHeight(NaN, 0, 0)).toThrow(RangeError);
    expect(() => signedCoast(NaN, 1)).toThrow(RangeError);
    expect(() => generateTerrain(NaN)).toThrow(RangeError);
    expect(() => generateTerrain(1.5)).toThrow(RangeError);
  });
});
