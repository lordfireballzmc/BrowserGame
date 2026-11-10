/**
 * F3.02 — original fast Runner silhouette, complementary to the Scrapper.
 * Narrow forward-thrust torso, double ribbon scarf, swept crest, light boots:
 * distinct at mobile play scale, no copied mobile-ad models. Mesh is authored
 * once; gait remains a small whole-figure visual cue until F4 skeletons.
 */
import {
  bevelBox, facetedCylinder, facetedEllipsoid, wedge, type Geometry,
} from "../mesh/Primitives";
import { combineRigidParts, type RigidPart } from "./Archetypes";
import type { MaterialToken } from "../../engine/render/Palette";

let cached: Geometry | null = null;
export function createRunnerStudy(): Geometry {
  if (cached) return cached;
  const parts: RigidPart[] = [];
  const add = (name: string, parent: string | null, token: MaterialToken,
    geometry: Geometry, x: number, y: number, z: number,
    rotationY = 0, rotationX = 0) => {
    const position: readonly [number, number, number] = [x,y,z];
    parts.push({
      name, parent, material: token, geometry,
      position, pivot: position, rotationY, rotationX,
    });
  };
  add("runner-hip", null, "enemy.dark",
    bevelBox(0.42,0.24,0.34,0.045),0,0.73,0.04);
  for (const side of [-1,1]) {
    const tag=side<0?"left":"right";
    add("leg-"+tag,"runner-hip","enemy.dark",
      bevelBox(0.16,0.58,0.18,0.036),side*0.13,0.33,0.05,
      0,side*0.15);
    add("boot-"+tag,"leg-"+tag,"stone.shadow",
      bevelBox(0.20,0.15,0.37,0.043),side*0.13,0.095,-0.065);
  }
  add("leaning-chest","runner-hip","enemy.red",
    facetedCylinder(0.25,0.73,7,0.16),0,1.13,-0.12,0,-0.19);
  add("collar","leaning-chest","enemy.dark",
    bevelBox(0.57,0.11,0.38,0.04),0,1.52,-0.22);
  add("head","collar","stone.base",
    facetedEllipsoid(0.23,0.235,0.24,8,4),0,1.73,-0.25);
  add("swift-helm","head","enemy.red",
    wedge(0.56,0.32,0.56),0,1.90,-0.28,Math.PI/2);
  add("black-brow","head","enemy.dark",
    bevelBox(0.44,0.10,0.12,0.018),0,1.75,-0.52);
  add("swept-crest","swift-helm","copper",
    wedge(0.26,0.40,0.63),0,2.08,0.01,Math.PI);
  add("left-arm","leaning-chest","enemy.red",
    bevelBox(0.16,0.52,0.19,0.032),-0.32,1.16,-0.22,0,-0.16);
  add("right-arm","leaning-chest","enemy.dark",
    bevelBox(0.16,0.48,0.19,0.032),0.32,1.15,-0.18,0,0.14);
  add("arm-blade","right-arm","metal",
    bevelBox(0.08,0.12,0.74,0.019),0.38,0.98,-0.50);
  add("scarf-knot","collar","enemy.red",
    bevelBox(0.30,0.21,0.19,0.028),0,1.52,0.09);
  add("scarf-banner","scarf-knot","enemy.red",
    wedge(0.31,0.19,1.28),0.18,1.43,0.83,Math.PI);
  add("scarf-tassel","scarf-banner","accent.warning",
    wedge(0.20,0.13,0.68),0.18,1.35,1.72,Math.PI);
  cached = combineRigidParts(parts);
  return cached;
}
