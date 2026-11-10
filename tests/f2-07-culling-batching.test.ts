import { describe, expect, it } from "vitest";
import { mat4 } from "gl-matrix";
import { bevelBox, validateGeometry } from "../src/art/mesh/Primitives";
import { mergeStaticGeometries } from "../src/art/mesh/StaticBatch";
import { aabbIntersectsFrustum } from "../src/engine/render/Frustum";

describe("F2.07 conservative frustum culling and immutable static geometry", () => {
  const box = bevelBox(1, 1, 1, 0.1);
  const identity = mat4.create();

  it("preserves centered, boundary-intersecting and rotated geometry", () => {
    expect(aabbIntersectsFrustum(box.bounds, identity, identity)).toBe(true);
    for (const [x,y,z] of [[1.3,0,0],[-1.3,0,0],[0,1.3,0],[0,0,-1.3]]) {
      expect(aabbIntersectsFrustum(box.bounds,
        mat4.fromTranslation(mat4.create(),[x,y,z]),identity)).toBe(true);
    }
    const rotated = mat4.fromRotation(mat4.create(), Math.PI/4, [0,1,0]);
    mat4.translate(rotated,rotated,[1.2,0,0]);
    expect(aabbIntersectsFrustum(box.bounds,rotated,identity)).toBe(true);
  });

  it("rejects every clip-plane exterior and accepts a real camera transform", () => {
    for (const [x,y,z] of [[3,0,0],[-3,0,0],[0,3,0],[0,-3,0],[0,0,3],[0,0,-3]]) {
      expect(aabbIntersectsFrustum(box.bounds,
        mat4.fromTranslation(mat4.create(),[x,y,z]),identity)).toBe(false);
    }
    const view = mat4.lookAt(mat4.create(),[8,11,8],[0,0,0],[0,1,0]);
    const projection = mat4.ortho(mat4.create(),-5,5,-4,4,0.1,50);
    const vp = mat4.multiply(mat4.create(),projection,view);
    expect(aabbIntersectsFrustum(box.bounds,identity,vp)).toBe(true);
    expect(aabbIntersectsFrustum(box.bounds,
      mat4.fromTranslation(mat4.create(),[100,0,0]),vp)).toBe(false);
  });

  it("retains exact authored vertex attributes and index offsets when batching", () => {
    const left = bevelBox(1,1,1,0.1,4);
    const right = bevelBox(2,2,1,0.1,8);
    const merged = mergeStaticGeometries([left,right]);
    expect(() => validateGeometry(merged)).not.toThrow();
    expect(merged.positions.length).toBe(left.positions.length+right.positions.length);
    expect(merged.indices.length).toBe(left.indices.length+right.indices.length);
    expect([...merged.materialIds]).toEqual([...left.materialIds,...right.materialIds]);
    expect(merged.indices[left.indices.length]).toBe(
      right.indices[0]!+left.positions.length/3,
    );
    expect(merged.bounds.min).toEqual([-1,-1,-0.5]);
    expect(merged.bounds.max).toEqual([1,1,0.5]);
    expect(() => mergeStaticGeometries([])).toThrow(/empty/);
  });

  it("is deterministic and does not lose triangles when merging", () => {
    const a=mergeStaticGeometries([box,box,box]);
    const b=mergeStaticGeometries([box,box,box]);
    expect(a.positions).toEqual(b.positions);
    expect(a.normals).toEqual(b.normals);
    expect(a.materialIds).toEqual(b.materialIds);
    expect(a.indices).toEqual(b.indices);
    expect(a.indices.length/3).toBe(box.indices.length);
  });
});
