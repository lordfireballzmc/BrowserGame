import { describe, expect, it } from "vitest";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { MATERIAL_TOKENS } from "../src/engine/render/Palette";
import { TERRAIN_SPEC, generateTerrain, signedCoast, terrainHeight } from "../src/art/terrain/Island";
import { PAD_SITES } from "../src/art/terrain/Pads";
import { ROAD_SAMPLES } from "../src/art/terrain/RoadPath";
import {
  RIVER_SPEC, riverCarveDepth, riverCenterZ, riverHalfWidth,
  riverOuterBankWidth, riverWaterContains,
} from "../src/art/terrain/RiverPath";
import { generateNorthernRiver } from "../src/art/terrain/River";

const seed = "fenwall-crossing-v1";
const water = generateNorthernRiver(seed);

describe("F2.04: northern decorative river and stratified banks", () => {
  it("creates 66 authored river sections, two wooden bridges, and cached CPU meshes", () => {
    expect(water).toBe(generateNorthernRiver(seed));
    expect(water.segments).toBe(66);
    expect(water.bridgePositions).toHaveLength(2);
    expect(water.bridgePositions.map(p => p[0])).toEqual([-16, 16]);
    for (const geometry of [water.water, water.banks, water.bridge]) {
      expect(() => validateGeometry(geometry)).not.toThrow();
      expect(geometry.positions.length).toBeGreaterThan(100);
    }
    expect(water.bridge.bounds.max[1]).toBeGreaterThan(0.9);
    expect(water.bridge.bounds.min[1]).toBeGreaterThanOrEqual(0);
  });

  it("keeps all water and river-bank faces physically inside the island rim", () => {
    for (const geometry of [water.water, water.banks]) {
      for (let i = 0; i < geometry.positions.length; i += 3) {
        const x = geometry.positions[i]!, z = geometry.positions[i+2]!;
        expect(signedCoast(x,z)).toBeLessThan(0);
        expect(Math.abs(x)).toBeLessThanOrEqual(33);
        expect(Math.abs(z)).toBeLessThan(24);
      }
    }
    expect(water.water.bounds.min[2]).toBeGreaterThan(15);
    expect(water.water.bounds.max[2]).toBeLessThan(24);
  });

  it("carves the water bed below water level at every visible mesh vertex", () => {
    for (let i = 0; i < water.water.positions.length; i += 3) {
      const x = water.water.positions[i]!, z = water.water.positions[i + 2]!;
      const bed = terrainHeight(seed, x, z);
      expect(bed).toBeLessThan(RIVER_SPEC.waterHeightMeters - 0.025);
      expect(water.water.positions[i + 1]).toBeCloseTo(RIVER_SPEC.waterHeightMeters, 5);
    }
  });

  it("has 2 precisely bounded semantic strata with no invented water color tokens", () => {
    const waterSlot = MATERIAL_TOKENS.indexOf("water") + 1;
    const earthSlot = MATERIAL_TOKENS.indexOf("earth.cut") + 1;
    const stoneSlot = MATERIAL_TOKENS.indexOf("stone.shadow") + 1;
    expect(new Set(water.water.materialIds)).toEqual(new Set([waterSlot]));
    expect(new Set(water.banks.materialIds)).toEqual(new Set([earthSlot, stoneSlot]));
    const bridgeSlots = new Set(water.bridge.materialIds);
    expect(bridgeSlots.has(MATERIAL_TOKENS.indexOf("timber.base") + 1)).toBe(true);
    expect(bridgeSlots.has(MATERIAL_TOKENS.indexOf("timber.light") + 1)).toBe(true);
    expect(water.water.indices.length / 3).toBe(2 * water.segments);
    expect(water.banks.indices.length / 3).toBe(8 * water.segments);
  });

  it("uses globally continuous authored curvature with tapered endpoints", () => {
    let previous = riverCenterZ(-33);
    for (let x = -32.5; x <= 33; x += 0.5) {
      const current = riverCenterZ(x);
      expect(Math.abs(current - previous)).toBeLessThan(0.2);
      previous = current;
      expect(riverHalfWidth(x)).toBeGreaterThan(0);
      expect(riverOuterBankWidth(x)).toBeGreaterThan(riverHalfWidth(x));
    }
    expect(riverHalfWidth(-33)).toBeLessThan(riverHalfWidth(0) * 0.2);
    expect(riverWaterContains(0,riverCenterZ(0))).toBe(true);
    expect(riverWaterContains(0,9)).toBe(false);
    expect(riverWaterContains(36,19)).toBe(false);
  });

  it("never covers any road sample or pad's north 4x4 footprint", () => {
    for (const p of ROAD_SAMPLES) {
      expect(riverCarveDepth(p.x,p.z)).toBe(0);
    }
    for (const pad of PAD_SITES) {
      // At each tower's X, the river's south-facing outer bank clears
      // the full northern edge of its 4m construction square.
      const southEdge = riverCenterZ(pad.x) - riverOuterBankWidth(pad.x);
      if (pad.x >= -33 && pad.x <= 33) {
        expect(southEdge).toBeGreaterThan(pad.z+2);
      }
      expect(riverCarveDepth(pad.x,pad.z)).toBe(0);
    }
    for (const bridge of water.bridgePositions) {
      expect(riverCarveDepth(bridge[0],bridge[2])).toBeCloseTo(RIVER_SPEC.maximumCarveMeters, 6);
    }
  });

  it("keeps adjacent seed-heightfield tiles exactly seam-aligned after carving", () => {
    for (const version of [seed,"fenwall-crossing-v2"]) {
      const tiles=generateTerrain(version).tiles;
      expect(tiles).toHaveLength(54);
      for(let row=0;row<TERRAIN_SPEC.tilesZ;row++)
        for(let col=0;col<TERRAIN_SPEC.tilesX;col++){
          const here=tiles[row*TERRAIN_SPEC.tilesX+col]!;
          if(col+1<TERRAIN_SPEC.tilesX) {
            const right=tiles[row*TERRAIN_SPEC.tilesX+col+1]!;
            for(let j=0;j<=8;j++) expect(here.samples[j*9+8]).toBe(right.samples[j*9]);
          }
          if(row+1<TERRAIN_SPEC.tilesZ){
            const north=tiles[(row+1)*TERRAIN_SPEC.tilesX+col]!;
            for(let i=0;i<=8;i++) expect(here.samples[8*9+i]).toBe(north.samples[i]);
          }
        }
    }
  });

  it("varies gently with seed without moving decorative water or bridges", () => {
    const other=generateNorthernRiver("fenwall-crossing-v2");
    expect(other.seed).not.toBe(water.seed);
    expect(other.bridgePositions).toEqual(water.bridgePositions);
    expect(other.water.positions).toEqual(water.water.positions);
    expect(other.banks.positions).not.toEqual(water.banks.positions);
    expect(generateNorthernRiver(seed)).toBe(water);
  });

  it("rejects nonfinite river coordinate queries and invalid seeds", () => {
    expect(() => riverCenterZ(NaN)).toThrow(RangeError);
    expect(() => riverHalfWidth(Infinity)).toThrow(RangeError);
    expect(() => riverCarveDepth(0,NaN)).toThrow(RangeError);
    expect(() => riverWaterContains(Infinity,0)).toThrow(RangeError);
    expect(() => generateNorthernRiver(1.25)).toThrow(RangeError);
  });
});
