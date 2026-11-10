/**
 * F3.03 — small original 3D bolt and physical impact highlights.
 * Faceted bronze head, warm shaft, metal collar and four readable fletchings.
 * No billboard cheat, emissive bloom, borrowed decals or per-frame meshing.
 */
import { bevelBox, facetedCylinder, wedge, type Geometry } from "../mesh/Primitives";
import { combineRigidParts, type RigidPart } from "./Archetypes";
import type { MaterialToken } from "../../engine/render/Palette";

let bolt: Geometry | null = null;
let impact: Geometry | null = null;

function join(
  recipe: ReadonlyArray<readonly [
    string, MaterialToken, Geometry,
    number, number, number, number?, number?,
  ]>,
): Geometry {
  const parts: RigidPart[] = recipe.map(
    ([name, material, geometry, x, y, z, rotationY, rotationX],i) => ({
      name, parent: i===0 ? null : recipe[0]![0],
      material, geometry, position:[x,y,z], pivot:[x,y,z],
      rotationY, rotationX,
    }),
  );
  return combineRigidParts(parts);
}

/** Local forward is -Z, same convention as the Warden's handheld launcher. */
export function createHeroBoltMesh(): Geometry {
  if (bolt) return bolt;
  bolt=join([
    ["shaft","timber.light",bevelBox(0.085,0.075,0.57,0.022),0,0,0],
    ["ferrule","metal",bevelBox(0.145,0.12,0.14,0.024),0,0,-0.285],
    ["point","copper",wedge(0.20,0.14,0.28),0,0,-0.47,Math.PI/2],
    ["left-feather","ivory",wedge(0.17,0.08,0.22),-0.105,0,0.26],
    ["right-feather","ivory",wedge(0.17,0.08,0.22),0.105,0,0.26],
    ["upper-feather","defender.gold",bevelBox(0.065,0.16,0.21,0.012),0,0.06,0.26],
  ]);
  return bolt;
}

/** Flat/faceted 3D transient glint, rendered for only nine 60Hz steps. */
export function createBoltImpactMesh(): Geometry {
  if (impact) return impact;
  impact=join([
    ["center","ivory",facetedCylinder(0.20,0.09,8,0.13),0,0,0],
    ["horizontal","copper",bevelBox(0.67,0.09,0.095,0.022),0,0,0],
    ["vertical","defender.gold",bevelBox(0.09,0.67,0.095,0.022),0,0,0],
    ["diagonal-left","ivory",bevelBox(0.38,0.08,0.06,0.016),-0.12,0.13,0.02,0,Math.PI/4],
    ["diagonal-right","ivory",bevelBox(0.38,0.08,0.06,0.016),0.12,-0.13,0.02,0,-Math.PI/4],
  ]);
  return impact;
}
