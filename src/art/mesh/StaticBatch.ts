/**
 * F2.07 — merge immutable world-space pieces sharing a material/fallback into
 * one indexed mesh. Geometry is not re-tessellated or moved: facet normals,
 * semantic material slots, coastline boundaries and winding are preserved.
 * Build once before uploading; never concatenate during a render frame.
 */
import { validateGeometry, type Geometry } from "./Primitives";

export function mergeStaticGeometries(pieces: readonly Geometry[]): Geometry {
  if (pieces.length === 0) throw new Error("Cannot batch an empty set of meshes");
  let vertexCount = 0, indexCount = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const piece of pieces) {
    validateGeometry(piece);
    vertexCount += piece.positions.length / 3;
    indexCount += piece.indices.length;
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i]!, piece.bounds.min[i]);
      max[i] = Math.max(max[i]!, piece.bounds.max[i]);
    }
  }
  if (vertexCount > 0xffff_ffff) throw new RangeError("Static mesh vertex budget exceeded");
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const materialIds = new Uint8Array(vertexCount);
  const indices = vertexCount <= 65535 ? new Uint16Array(indexCount) : new Uint32Array(indexCount);
  let offset = 0, indexOffset = 0;
  for (const piece of pieces) {
    const count = piece.positions.length / 3;
    positions.set(piece.positions, offset * 3);
    normals.set(piece.normals, offset * 3);
    materialIds.set(piece.materialIds, offset);
    for (let i = 0; i < piece.indices.length; i++) {
      indices[indexOffset + i] = piece.indices[i]! + offset;
    }
    offset += count;
    indexOffset += piece.indices.length;
  }
  const merged: Geometry = {
    positions, normals, materialIds, indices,
    bounds: {
      min: [min[0]!, min[1]!, min[2]!],
      max: [max[0]!, max[1]!, max[2]!],
    },
  };
  validateGeometry(merged);
  return merged;
}
