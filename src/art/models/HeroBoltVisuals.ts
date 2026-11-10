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
    ["shaft","timber.light",bevelBox(0.13,0.105,0.84,0.035),0,0,-0.03],
    ["ferrule","metal",bevelBox(0.20,0.16,0.19,0.033),0,0,-0.47],
    ["point","copper",wedge(0.27,0.19,0.37),0,0,-0.71,Math.PI/2],
    ["left-feather","ivory",wedge(0.19,0.11,0.30),-0.14,0,0.36],
    ["right-feather","ivory",wedge(0.19,0.11,0.30),0.14,0,0.36],
    ["upper-feather","defender.gold",bevelBox(0.095,0.21,0.29,0.016),0,0.075,0.36],
    ["spine-inlay","ivory",bevelBox(0.055,0.12,0.46,0.012),0,0.085,-0.17],
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
