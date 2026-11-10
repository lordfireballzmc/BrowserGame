import { describe, expect, it } from "vitest";
import { bevelBox } from "../src/art/mesh/Primitives";
import { toThreeGeometry } from "../src/engine/render/UnifiedThreeRenderer";
import { linearColor } from "../src/engine/render/Palette";

describe("ART.02 bridge authored terrain/actors into one Three scene", () => {
  it("preserves geometry positions, normals, true indexed triangles and bounds", () => {
    const original = bevelBox(1.4, 2.2, 1.1, 0.08);
    const geometry = toThreeGeometry(original, "stone.base");
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    expect(positions.count).toBe(original.positions.length / 3);
    expect(normals.count).toBe(positions.count);
    expect(geometry.index?.count).toBe(original.indices.length);
    expect(Array.from(positions.array)).toEqual(Array.from(original.positions));
    expect(Array.from(normals.array)).toEqual(Array.from(original.normals));
    expect(geometry.boundingSphere?.radius).toBeGreaterThan(0);
    geometry.dispose();
  });

  it("uses inherited per-instance art tokens as actual linear vertex colors", () => {
    const geometry = toThreeGeometry(bevelBox(1,1,1), "defender.blue");
    const colors = geometry.getAttribute("color");
    const expected = linearColor("defender.blue");
    expect(colors.getX(0)).toBeCloseTo(expected[0], 6);
    expect(colors.getY(0)).toBeCloseTo(expected[1], 6);
    expect(colors.getZ(0)).toBeCloseTo(expected[2], 6);
    geometry.dispose();
  });

  it("preserves the original per-vertex override palette, not everything grey", () => {
    // Slot 5 is authored road.rut (slot 0 would inherit the instance token).
    const geometry = toThreeGeometry(bevelBox(1,1,1,0.04,5), "stone.base");
    const colors = geometry.getAttribute("color");
    const expected = linearColor("road.rut");
    expect(colors.getX(0)).toBeCloseTo(expected[0],6);
    expect(colors.getY(0)).toBeCloseTo(expected[1],6);
    expect(colors.getZ(0)).toBeCloseTo(expected[2],6);
    geometry.dispose();
  });

  it("rejects invalid previously-authored geometry before Three GPU upload", () => {
    const source=bevelBox(1,1,1);
    expect(()=>toThreeGeometry({...source,indices:new Uint16Array([999,0,1])},"copper"))
      .toThrow();
  });
});
