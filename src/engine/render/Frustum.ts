/**
 * F2.07 — conservative clip-volume rejection of transformed mesh AABBs.
 * Every corner shares one outcode for a rejection to be conclusive; we never
 * cull partly visible scenery or a caster merely because its center is outside.
 * All transforms are WebGL column-major. No allocations on the render path.
 */
import type { Geometry } from "../../art/mesh/Primitives";

export function aabbIntersectsFrustum(
  bounds: Geometry["bounds"],
  model: ArrayLike<number>,
  viewProjection: ArrayLike<number>,
): boolean {
  let outsideEveryCorner = 63;
  for (let i = 0; i < 8; i++) {
    const x = bounds[i & 1 ? "max" : "min"][0];
    const y = bounds[i & 2 ? "max" : "min"][1];
    const z = bounds[i & 4 ? "max" : "min"][2];
    const wx = model[0]! * x + model[4]! * y + model[8]! * z + model[12]!;
    const wy = model[1]! * x + model[5]! * y + model[9]! * z + model[13]!;
    const wz = model[2]! * x + model[6]! * y + model[10]! * z + model[14]!;
    const ww = model[3]! * x + model[7]! * y + model[11]! * z + model[15]!;
    const cx = viewProjection[0]! * wx + viewProjection[4]! * wy
      + viewProjection[8]! * wz + viewProjection[12]! * ww;
    const cy = viewProjection[1]! * wx + viewProjection[5]! * wy
      + viewProjection[9]! * wz + viewProjection[13]! * ww;
    const cz = viewProjection[2]! * wx + viewProjection[6]! * wy
      + viewProjection[10]! * wz + viewProjection[14]! * ww;
    const cw = viewProjection[3]! * wx + viewProjection[7]! * wy
      + viewProjection[11]! * wz + viewProjection[15]! * ww;
    const mask = (cx < -cw ? 1 : 0) | (cx > cw ? 2 : 0)
      | (cy < -cw ? 4 : 0) | (cy > cw ? 8 : 0)
      | (cz < -cw ? 16 : 0) | (cz > cw ? 32 : 0);
    outsideEveryCorner &= mask;
    if (outsideEveryCorner === 0) return true;
  }
  return outsideEveryCorner === 0;
}
