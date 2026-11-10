/**
 * F2.06 art-direction study: original stone-and-timber bolt spire.
 * A reusable physical tower silhouette, not a purchasable game object.
 * No borrowed advertising assets, textures or runtime-generated geometry.
 */
import { bevelBox, facetedCylinder, type Geometry } from "../mesh/Primitives";
import { combineRigidParts, type RigidPart } from "./Archetypes";
import type { MaterialToken } from "../../engine/render/Palette";

let cached: Geometry | null = null;

export function createBoltSpireStudy(): Geometry {
  if (cached) return cached;
  const parts: RigidPart[] = [];
  const add = (
    name: string, parent: string | null, material: MaterialToken,
    geometry: Geometry, x: number, y: number, z: number,
  ) => {
    const position: readonly [number, number, number] = [x, y, z];
    parts.push({ name, parent, material, geometry, position, pivot: position });
  };
  add("stone-footing", null, "stone.shadow",
    bevelBox(2.15, 0.46, 2.15, 0.14), 0, 0.23, 0);
  add("octagonal-pier", "stone-footing", "stone.base",
    facetedCylinder(0.78, 2.72, 8, 0.66), 0, 1.70, 0);
  add("pier-band", "octagonal-pier", "stone.highlight",
    bevelBox(1.93, 0.27, 1.93, 0.10), 0, 2.92, 0);
  add("turntable", "pier-band", "timber.base",
    facetedCylinder(0.73, 0.24, 8), 0, 3.17, 0);
  add("yoke", "turntable", "timber.light",
    bevelBox(3.05, 0.20, 0.30, 0.065), 0, 3.38, 0.35);
  add("left-bow-tip", "yoke", "metal",
    bevelBox(0.19, 0.18, 0.58, 0.05), -1.49, 3.40, 0.35);
  add("right-bow-tip", "yoke", "metal",
    bevelBox(0.19, 0.18, 0.58, 0.05), 1.49, 3.40, 0.35);
  add("long-stock", "turntable", "timber.base",
    bevelBox(0.34, 0.31, 2.25, 0.07), 0, 3.48, -0.28);
  add("bolt-rail", "long-stock", "metal",
    bevelBox(0.11, 0.08, 1.98, 0.03), 0, 3.68, -0.31);
  add("bolt-tip", "bolt-rail", "copper",
    facetedCylinder(0.105, 0.38, 6, 0), 0, 3.71, -1.27);
  add("blue-gusset", "octagonal-pier", "defender.blue",
    bevelBox(1.34, 0.78, 0.11, 0.035), 0, 2.18, 0.83);
  add("gold-crest", "blue-gusset", "defender.gold",
    bevelBox(0.60, 0.14, 0.16, 0.035), 0, 2.43, 0.91);
  cached = combineRigidParts(parts);
  return cached;
}
