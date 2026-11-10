import { describe, expect, it } from "vitest";
import {
  bevelBox, facetedCylinder, facetedEllipsoid, planarDisk, planarRibbon,
  pyramid, validateGeometry, wedge, type Geometry,
} from "../src/art/mesh/Primitives";

function invariants(mesh: Geometry): void {
  expect(() => validateGeometry(mesh)).not.toThrow();
  expect(mesh.positions).toBeInstanceOf(Float32Array);
  expect(mesh.normals).toBeInstanceOf(Float32Array);
  expect(mesh.materialIds).toBeInstanceOf(Uint8Array);
  expect(mesh.indices instanceof Uint16Array || mesh.indices instanceof Uint32Array).toBe(true);
  expect(mesh.positions.length).toBe(mesh.normals.length);
  expect(mesh.materialIds.length).toBe(mesh.positions.length / 3);
  expect(mesh.indices.length % 3).toBe(0);
  for (const v of [...mesh.positions, ...mesh.normals]) expect(Number.isFinite(v)).toBe(true);
  for (const i of mesh.indices) expect(i).toBeLessThan(mesh.positions.length / 3);
}

function triangles(mesh: Geometry): number {
  return mesh.indices.length / 3;
}

function expectBounds(mesh: Geometry, half: readonly number[], tolerance = 0.0001): void {
  for (let axis = 0; axis < 3; axis++) {
    expect(mesh.bounds.min[axis]).toBeCloseTo(-half[axis]!, 4);
    expect(mesh.bounds.max[axis]).toBeCloseTo(half[axis]!, 4);
    expect(mesh.bounds.max[axis]! - mesh.bounds.min[axis]!).toBeGreaterThan(tolerance);
  }
}

describe("F1.03 mesh contract", () => {
  it("builds a proper six-faced box without chamfers", () => {
    const box = bevelBox(2, 3, 4);
    invariants(box);
    expect(triangles(box)).toBe(12);
    expectBounds(box, [1, 1.5, 2]);
  });

  it("builds actual 12 chamfer strips plus eight triangular corners", () => {
    const box = bevelBox(2, 3, 4, 0.2, 7);
    invariants(box);
    expect(triangles(box)).toBe(44);
    expect(box.positions.length / 3).toBe(96);
    expectBounds(box, [1, 1.5, 2]);
    expect([...box.materialIds].every((id) => id === 7)).toBe(true);

    // True 3D bevel faces have non-axis-aligned facet normals.
    const normals = [...box.normals];
    const diagonalNormals = Array.from({ length: normals.length / 3 }, (_, i) => [
      normals[3 * i]!, normals[3 * i + 1]!, normals[3 * i + 2]!,
    ]).filter((n) => n.filter((v) => Math.abs(v) > 0.05).length >= 2);
    expect(diagonalNormals.length).toBeGreaterThan(0);
  });

  it("builds outward, capped cylinders and tapered frusta", () => {
    for (const top of [1, 0.55]) {
      const mesh = facetedCylinder(1, 4, 8, top, 2);
      invariants(mesh);
      expect(triangles(mesh)).toBe(32);
      expect(mesh.bounds.min[1]).toBeCloseTo(-2, 4);
      expect(mesh.bounds.max[1]).toBeCloseTo(2, 4);
      expect([...mesh.materialIds].every((id) => id === 2)).toBe(true);
    }
  });

  it("builds a triangular prism wedge with exactly five planar faces", () => {
    const mesh = wedge(2, 3, 4);
    invariants(mesh);
    expect(triangles(mesh)).toBe(8);
    expectBounds(mesh, [1, 1.5, 2]);
  });

  it("builds a four-sided pyramid with explicit flat facets and base", () => {
    const mesh = pyramid(2, 4, 6);
    invariants(mesh);
    expect(triangles(mesh)).toBe(6);
    expectBounds(mesh, [1, 2, 3]);
  });

  it("generates a low-poly ellipsoid with nondegenerate triangles", () => {
    const mesh = facetedEllipsoid(3, 2, 1, 12, 6);
    invariants(mesh);
    expect(triangles(mesh)).toBe(2 * 12 * (6 - 1));
    expect(mesh.bounds.min[1]).toBeCloseTo(-2, 4);
    expect(mesh.bounds.max[1]).toBeCloseTo(2, 4);
    expect(mesh.bounds.max[0]).toBeCloseTo(3, 4);
    expect(mesh.bounds.max[2]).toBeCloseTo(1, 4);
  });

  it("builds small-sided and dense ellipsoids without degenerate poles", () => {
    for (const segments of [3, 8, 16]) for (const bands of [2, 4, 8]) {
      invariants(facetedEllipsoid(1, 1, 1, segments, bands));
    }
  });

  it("builds a horizontal disk with an exact Y and upward normals", () => {
    const mesh = planarDisk(1.8, 8, 0.02, 4);
    invariants(mesh);
    expect(triangles(mesh)).toBe(8);
    expect(mesh.bounds.min[1]).toBeCloseTo(0.02, 4);
    expect(mesh.bounds.max[1]).toBeCloseTo(0.02, 4);
    for (let i = 0; i < mesh.normals.length; i += 3) {
      expect(mesh.normals[i + 1]).toBeCloseTo(1, 6);
    }
  });

  it("forms a continuous straight ribbon with exact width and no seams", () => {
    const mesh = planarRibbon([[0, 0], [0, 5], [0, 10]], 4.5);
    invariants(mesh);
    expect(triangles(mesh)).toBe(4);
    expect(mesh.bounds.min[0]).toBeCloseTo(-2.25, 4);
    expect(mesh.bounds.max[0]).toBeCloseTo(2.25, 4);
    expect(mesh.bounds.min[1]).toBeCloseTo(0.02, 4);
    expect(mesh.bounds.max[2]).toBeCloseTo(10, 4);
  });

  it("handles an authored sharp bend with capped miter joins", () => {
    const mesh = planarRibbon([[0, 0], [0, 5], [5, 5]], 2, 0.02, 1.35, 3);
    invariants(mesh);
    expect(triangles(mesh)).toBe(4);
    expect([...mesh.materialIds].every((id) => id === 3)).toBe(true);
    // All ribbon vertices must stay in the intended plane.
    for (let i = 1; i < mesh.positions.length; i += 3) {
      expect(mesh.positions[i]).toBeCloseTo(0.02, 5);
    }
  });

  it("has deterministic buffer bytes for identical mesh parameters", () => {
    for (const make of [
      () => bevelBox(2, 3, 4, 0.22, 17),
      () => facetedCylinder(0.6, 2, 7, 0.4),
      () => wedge(1, 2, 3),
      () => pyramid(2, 1, 2),
      () => facetedEllipsoid(0.5, 1.5, 0.8, 9, 5),
      () => planarDisk(2, 8),
      () => planarRibbon([[0, 0], [1, 1], [2, 1]], 0.3),
    ]) {
      const a = make(), b = make();
      expect(a.positions).toEqual(b.positions);
      expect(a.normals).toEqual(b.normals);
      expect(a.indices).toEqual(b.indices);
      expect(a.materialIds).toEqual(b.materialIds);
      expect(a.bounds).toEqual(b.bounds);
    }
  });

  it("keeps authored input arrays unchanged", () => {
    const path = [[0, 0], [5, 0], [7, 2]] as const;
    const snapshot = JSON.stringify(path);
    planarRibbon(path, 1.2);
    expect(JSON.stringify(path)).toBe(snapshot);
  });

  it("rejects missing geometry dimensions and invalid facet counts", () => {
    expect(() => bevelBox(2, 3, 4, 1.01)).toThrow(RangeError);
    expect(() => bevelBox(2, 3, 4, -0.01)).toThrow(RangeError);
    expect(() => bevelBox(0, 2, 3)).toThrow(RangeError);
    expect(() => wedge(1, Number.POSITIVE_INFINITY, 2)).toThrow(RangeError);
    expect(() => pyramid(1, 0, 1)).toThrow(RangeError);
    expect(() => facetedCylinder(1, 2, 2)).toThrow(RangeError);
    expect(() => facetedCylinder(1, 2, 8, 0)).toThrow(RangeError);
    expect(() => facetedEllipsoid(1, 2, 3, 6, 1)).toThrow(RangeError);
    expect(() => planarDisk(1, 129)).toThrow(RangeError);
    expect(() => planarDisk(1, 8, Infinity)).toThrow(RangeError);
    expect(() => bevelBox(1, 1, 1, 0.1, 256)).toThrow(RangeError);
  });

  it("rejects zero-length/reversing paths, malformed points and bad miters", () => {
    expect(() => planarRibbon([[0, 0]], 2)).toThrow(RangeError);
    expect(() => planarRibbon([[0, 0], [0, 0]], 2)).toThrow(RangeError);
    expect(() => planarRibbon([[0, 0], [2, 0], [0, 0]], 2)).toThrow(RangeError);
    expect(() => planarRibbon([[0, 0], [Number.NaN, 1]], 2)).toThrow(RangeError);
    expect(() => planarRibbon([[0, 0], [1, 1]], 0)).toThrow(RangeError);
    expect(() => planarRibbon([[0, 0], [1, 1]], 1, 0, 0.5)).toThrow(RangeError);
  });

  it("detects out-of-range indices, zero-area faces and incorrect winding", () => {
    const original = bevelBox(2, 2, 2);
    const invalid = new Uint16Array(original.indices);
    invalid[0] = 65000;
    expect(() => validateGeometry({ ...original, indices: invalid })).toThrow(/index/);

    const degenerate = new Uint16Array(original.indices);
    degenerate[1] = degenerate[0]!;
    expect(() => validateGeometry({ ...original, indices: degenerate })).toThrow(/index/);

    const reversed = new Uint16Array(original.indices);
    [reversed[0], reversed[1]] = [reversed[1]!, reversed[0]!];
    expect(() => validateGeometry({ ...original, indices: reversed })).toThrow(/winding/);

    const incorrectBounds = { ...original, bounds: { min: [0, 0, 0] as const, max: original.bounds.max } };
    expect(() => validateGeometry(incorrectBounds)).toThrow(/bounds/);

    const badNormals = new Float32Array(original.normals);
    badNormals[0] = 20;
    expect(() => validateGeometry({ ...original, normals: badNormals })).toThrow(/normal/);
  });
});
