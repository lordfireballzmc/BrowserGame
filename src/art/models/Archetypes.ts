/**
 * F1.06: four original, authored miniature-diorama archetypes.
 *
 * All coordinates are meters in the shared X-east / Y-up / Z-north world.
 * Hierarchical named rigid parts keep animation pivots discoverable for F3.
 * They are assembled once from F1.03 flat-shaded meshes, with palette material
 * IDs baked per vertex, then uploaded once as one mesh per archetype.
 * No asset extraction, randomness, generic placeholder cubes or per-frame meshing.
 */
import { mat3, mat4, vec3 } from "gl-matrix";
import {
  bevelBox, facetedCylinder, facetedEllipsoid, pyramid, wedge,
  validateGeometry, type Geometry, type Point3,
} from "../mesh/Primitives";
import { MATERIAL_TOKENS, type MaterialToken } from "../../engine/render/Palette";

export type ArchetypeId = "warden" | "scrapper" | "shieldbearer" | "core";

export interface RigidPart {
  readonly name: string;
  readonly parent: string | null;
  readonly pivot: Point3;
  readonly geometry: Geometry;
  readonly material: MaterialToken;
  readonly position: Point3;
  readonly rotationY?: number;
  readonly rotationX?: number;
}

export interface AuthoredArchetype {
  readonly id: ArchetypeId;
  readonly title: string;
  readonly heightMeters: number;
  readonly parts: readonly RigidPart[];
  readonly mesh: Geometry;
}

type Spec = Omit<RigidPart, "geometry"> & { geometry: Geometry };

function part(
  name: string, parent: string | null, geometry: Geometry, material: MaterialToken,
  position: Point3, rotationY = 0, rotationX = 0,
): Spec {
  return { name, parent, pivot: position, geometry, material, position, rotationY, rotationX };
}

/** Hard-normal, CCW merged mesh. Primitive identity is kept in the named part list. */
export function combineRigidParts(parts: readonly RigidPart[]): Geometry {
  if (!parts.length) throw new Error("Archetype requires at least one authored part");
  const positions: number[] = [];
  const normals: number[] = [];
  const materials: number[] = [];
  const indices: number[] = [];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const known = new Set<string>();
  for (const component of parts) {
    if (!component.name || known.has(component.name)) {
      throw new Error("Rigid part names must be unique and nonempty");
    }
    if (component.parent && !known.has(component.parent)) {
      throw new Error("Rigid part parent must precede child: " + component.parent);
    }
    known.add(component.name);
    validateGeometry(component.geometry);
    const slot = MATERIAL_TOKENS.indexOf(component.material) + 1;
    if (slot === 0) throw new Error("Unrecognized material token: " + component.material);
    const matrix = mat4.create();
    mat4.translate(matrix, matrix, component.position);
    if (component.rotationY) mat4.rotateY(matrix, matrix, component.rotationY);
    if (component.rotationX) mat4.rotateX(matrix, matrix, component.rotationX);
    const normalMatrix = mat3.normalFromMat4(mat3.create(), matrix);
    if (!normalMatrix) throw new Error("Rigid part transform cannot be inverted");
    const baseIndex = positions.length / 3;
    for (let i = 0; i < component.geometry.positions.length; i += 3) {
      const v = vec3.fromValues(
        component.geometry.positions[i]!, component.geometry.positions[i + 1]!,
        component.geometry.positions[i + 2]!,
      );
      vec3.transformMat4(v, v, matrix);
      positions.push(v[0], v[1], v[2]);
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis]!, v[axis]!);
        max[axis] = Math.max(max[axis]!, v[axis]!);
      }
      const n = vec3.fromValues(
        component.geometry.normals[i]!, component.geometry.normals[i + 1]!,
        component.geometry.normals[i + 2]!,
      );
      vec3.transformMat3(n, n, normalMatrix);
      vec3.normalize(n, n);
      normals.push(n[0], n[1], n[2]);
      materials.push(slot);
    }
    for (const i of component.geometry.indices) indices.push(baseIndex + i);
  }

  const result: Geometry = {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    materialIds: new Uint8Array(materials),
    indices: positions.length / 3 <= 65_535
      ? new Uint16Array(indices) : new Uint32Array(indices),
    bounds: {
      min: [min[0]!, min[1]!, min[2]!],
      max: [max[0]!, max[1]!, max[2]!],
    },
  };
  validateGeometry(result);
  return result;
}

function makeWardenParts(): RigidPart[] {
  // Hero faces roughly -Z; camera sees the blue hood, gold shoulders and mantle.
  return [
    part("root", null, bevelBox(0.25, 0.19, 0.27, 0.025), "stone.shadow", [0, 0.78, 0]),
    part("hip", "root", bevelBox(0.52, 0.25, 0.35, 0.045), "timber.base", [0, 0.78, 0]),
    part("left-leg", "hip", bevelBox(0.20, 0.61, 0.24, 0.04), "stone.shadow", [-0.15, 0.34, 0]),
    part("right-leg", "hip", bevelBox(0.20, 0.61, 0.24, 0.04), "stone.shadow", [0.15, 0.34, 0]),
    part("torso", "hip", facetedCylinder(0.32, 0.65, 7, 0.28), "stone.base", [0, 1.13, 0]),
    part("mantle", "torso", pyramid(0.94, 0.87, 0.67), "defender.gold", [0, 0.92, 0.14], 0, Math.PI),
    part("left-shoulder", "torso", bevelBox(0.36, 0.18, 0.32, 0.055), "defender.gold", [-0.30, 1.42, 0]),
    part("right-shoulder", "torso", bevelBox(0.36, 0.18, 0.32, 0.055), "defender.gold", [0.30, 1.42, 0]),
    part("left-arm", "left-shoulder", bevelBox(0.18, 0.47, 0.18, 0.025), "stone.base", [-0.40, 1.15, -0.03]),
    part("right-arm", "right-shoulder", bevelBox(0.18, 0.47, 0.18, 0.025), "stone.base", [0.40, 1.15, -0.03]),
    part("head", "torso", facetedEllipsoid(0.285, 0.29, 0.275, 8, 4), "ivory", [0, 1.72, -0.01]),
    part("blue-hood", "head", facetedEllipsoid(0.335, 0.29, 0.31, 8, 4), "defender.blue", [0, 1.79, 0.10]),
    part("hood-face-opening", "head", bevelBox(0.40, 0.23, 0.07, 0.035), "ivory", [0, 1.67, -0.23]),
    part("gold-brow", "head", bevelBox(0.49, 0.10, 0.20, 0.025), "defender.gold", [0, 1.97, -0.18]),
    part("launcher-stock", "right-arm", bevelBox(0.14, 0.14, 0.68, 0.02), "timber.base", [0.55, 1.20, -0.31]),
    part("launcher-limb", "launcher-stock", bevelBox(0.76, 0.075, 0.11, 0.015), "metal", [0.55, 1.23, -0.62]),
    part("launcher-bolt", "launcher-stock", bevelBox(0.05, 0.055, 0.67, 0.01), "copper", [0.55, 1.31, -0.47]),
  ];
}

function makeScrapperParts(): RigidPart[] {
  return [
    part("root", null, bevelBox(0.21, 0.20, 0.25, 0.025), "enemy.dark", [0, 0.73, 0]),
    part("hip", "root", bevelBox(0.44, 0.24, 0.32, 0.04), "enemy.dark", [0, 0.72, 0]),
    part("left-leg", "hip", bevelBox(0.18, 0.60, 0.20, 0.03), "stone.shadow", [-0.12, 0.33, 0]),
    part("right-leg", "hip", bevelBox(0.18, 0.60, 0.20, 0.03), "stone.shadow", [0.12, 0.33, 0]),
    part("torso", "hip", facetedCylinder(0.27, 0.68, 6, 0.22), "enemy.red", [0, 1.10, 0]),
    part("left-arm", "torso", bevelBox(0.16, 0.44, 0.17, 0.03), "enemy.red", [-0.34, 1.08, 0]),
    part("right-arm", "torso", bevelBox(0.16, 0.44, 0.17, 0.03), "enemy.dark", [0.34, 1.08, 0]),
    part("head", "torso", facetedEllipsoid(0.27, 0.26, 0.27, 7, 3), "stone.base", [0, 1.56, -0.02]),
    part("wedge-hood", "head", wedge(0.67, 0.38, 0.59), "enemy.red", [0, 1.66, 0.03], Math.PI / 2),
    part("dark-brow", "head", bevelBox(0.50, 0.11, 0.13, 0.025), "enemy.dark", [0, 1.64, -0.28]),
    part("spear-shaft", "right-arm", facetedCylinder(0.045, 2.20, 5), "timber.base", [0.52, 1.10, -0.28]),
    part("spear-head", "spear-shaft", pyramid(0.25, 0.34, 0.25), "metal", [0.52, 2.34, -0.28]),
  ];
}

function makeShieldbearerParts(): RigidPart[] {
  return [
    part("root", null, bevelBox(0.25, 0.19, 0.29, 0.025), "enemy.dark", [0, 0.76, 0]),
    part("hip", "root", bevelBox(0.65, 0.25, 0.40, 0.06), "enemy.dark", [0, 0.78, 0]),
    part("left-leg", "hip", bevelBox(0.22, 0.61, 0.24, 0.035), "stone.shadow", [-0.23, 0.32, 0]),
    part("right-leg", "hip", bevelBox(0.22, 0.61, 0.24, 0.035), "stone.shadow", [0.23, 0.32, 0]),
    part("torso", "hip", facetedCylinder(0.43, 0.71, 8, 0.38), "enemy.red", [0, 1.12, 0]),
    part("helm", "torso", facetedCylinder(0.35, 0.34, 8, 0.34), "enemy.dark", [0, 1.66, -0.04]),
    part("helm-brim", "helm", bevelBox(0.77, 0.11, 0.69, 0.04), "metal", [0, 1.57, -0.06]),
    part("left-arm", "torso", bevelBox(0.20, 0.47, 0.21, 0.025), "enemy.dark", [-0.42, 1.12, 0]),
    part("right-arm", "torso", bevelBox(0.20, 0.47, 0.21, 0.025), "enemy.dark", [0.42, 1.12, 0]),
    part("shield-main", "left-arm", bevelBox(1.08, 0.89, 0.13, 0.08), "enemy.dark", [-0.36, 1.12, 0.42]),
    part("shield-kite-tip", "shield-main", pyramid(0.99, 0.60, 0.13), "enemy.dark", [-0.36, 0.59, 0.43], 0, Math.PI),
    part("shield-face-cross", "shield-main", bevelBox(0.13, 0.90, 0.16, 0.02), "metal", [-0.36, 1.12, 0.54]),
    part("shield-rim", "shield-main", bevelBox(1.12, 0.11, 0.17, 0.025), "metal", [-0.36, 1.52, 0.53]),
    part("shield-boss", "shield-main", facetedEllipsoid(0.15, 0.16, 0.12, 7, 3), "stone.highlight", [-0.36, 1.13, 0.60]),
    part("short-sword", "right-arm", bevelBox(0.10, 0.76, 0.14, 0.02), "metal", [0.57, 1.17, -0.27]),
    part("sword-grip", "right-arm", bevelBox(0.27, 0.10, 0.18, 0.02), "timber.base", [0.57, 0.84, -0.27]),
  ];
}

function makeCoreParts(): RigidPart[] {
  const parts: RigidPart[] = [
    part("foundation", null, bevelBox(7.0, 0.70, 7.0, 0.17), "stone.shadow", [0, 0.35, 0]),
    part("wall", "foundation", bevelBox(5.55, 3.72, 5.40, 0.17), "stone.base", [0, 2.37, 0]),
    part("wall-course", "wall", bevelBox(5.88, 0.36, 5.78, 0.09), "stone.highlight", [0, 3.46, 0]),
    part("roof-eave", "wall", bevelBox(6.85, 0.25, 6.25, 0.07), "timber.base", [0, 4.40, 0]),
    // Two complementary triangular roof prisms create a gabled roof ridge.
    part("roof-east", "roof-eave", wedge(3.38, 1.95, 6.15), "defender.blue", [1.68, 5.30, 0]),
    part("roof-west", "roof-eave", wedge(3.38, 1.95, 6.15), "defender.blue", [-1.68, 5.30, 0], Math.PI),
    part("gate-shadow", "wall", bevelBox(1.62, 2.52, 0.18, 0.05), "ink", [0, 1.45, 2.77]),
    part("gate-left", "gate-shadow", bevelBox(0.31, 2.48, 0.32, 0.04), "timber.base", [-0.86, 1.46, 2.99]),
    part("gate-right", "gate-shadow", bevelBox(0.31, 2.48, 0.32, 0.04), "timber.base", [0.86, 1.46, 2.99]),
    part("gate-lintel", "gate-shadow", bevelBox(2.06, 0.42, 0.37, 0.06), "stone.highlight", [0, 2.87, 3.01]),
    part("gate-crossbeam", "gate-shadow", bevelBox(1.15, 0.16, 0.15, 0.03), "timber.light", [0, 1.26, 2.93]),
    part("pennant-pole", "roof-eave", facetedCylinder(0.045, 0.79, 6), "timber.base", [0, 6.31, 0.03]),
    part("pennant", "pennant-pole", wedge(0.73, 0.38, 0.07), "defender.gold", [0.38, 6.52, 0.03]),
  ];
  for (const x of [-2.84, 2.84]) for (const z of [-2.79, 2.79]) {
    const suffix = (x < 0 ? "w" : "e") + (z < 0 ? "n" : "s");
    parts.push(part("buttress-" + suffix, "foundation",
      bevelBox(0.78, 3.7, 0.82, 0.09), "stone.shadow", [x, 2.17, z]));
    parts.push(part("buttress-cap-" + suffix, "buttress-" + suffix,
      bevelBox(0.96, 0.33, 1.0, 0.08), "stone.highlight", [x, 4.09, z]));
  }
  return parts;
}

const builders: Readonly<Record<ArchetypeId, () => RigidPart[]>> = {
  warden: makeWardenParts,
  scrapper: makeScrapperParts,
  shieldbearer: makeShieldbearerParts,
  core: makeCoreParts,
};

export const ARCHETYPE_IDS = Object.freeze([
  "warden", "scrapper", "shieldbearer", "core",
] as const satisfies readonly ArchetypeId[]);

export const ARCHETYPE_SPEC: Readonly<Record<ArchetypeId, {
  readonly title: string;
  readonly targetHeightMeters: number;
  readonly signature: readonly MaterialToken[];
}>> = {
  warden: { title: "Warden", targetHeightMeters: 2.05,
    signature: ["defender.gold", "defender.blue", "stone.base"] },
  scrapper: { title: "Scrapper", targetHeightMeters: 2.50,
    signature: ["enemy.red", "timber.base", "metal"] },
  shieldbearer: { title: "Shieldbearer", targetHeightMeters: 1.95,
    signature: ["enemy.dark", "metal", "enemy.red"] },
  core: { title: "Frontier Keep", targetHeightMeters: 6.95,
    signature: ["stone.base", "stone.shadow", "defender.blue"] },
};

const cache = new Map<ArchetypeId, AuthoredArchetype>();

export function getArchetype(id: ArchetypeId): AuthoredArchetype {
  const cached = cache.get(id);
  if (cached) return cached;
  const parts = builders[id]();
  const result: AuthoredArchetype = {
    id, title: ARCHETYPE_SPEC[id].title,
    heightMeters: ARCHETYPE_SPEC[id].targetHeightMeters,
    parts, mesh: combineRigidParts(parts),
  };
  cache.set(id, result);
  return result;
}
