/**
 * F1.06 noninteractive archetype inspection arrangement.
 *
 * This is an asset-review gallery, not a gameplay level, terrain system, or
 * battle simulation. Four models have authored world positions and grounded
 * display slabs; uploaded meshes are cached within one WebGL2 renderer.
 */
import { mat4 } from "gl-matrix";
import { bevelBox } from "../mesh/Primitives";
import { ARCHETYPE_IDS, getArchetype } from "./Archetypes";
import type { InstancedRenderer, RenderInstance } from "../../engine/render/InstancedRenderer";

const GALLERY_RIGHT: readonly [number, number] = [
  Math.SQRT1_2, -Math.SQRT1_2,
];
const positions: Readonly<Record<(typeof ARCHETYPE_IDS)[number], number>> = {
  warden: -11,
  scrapper: -4,
  shieldbearer: 4,
  core: 13,
};

function modelAt(right: number, y: number): Float32Array {
  const matrix = mat4.fromTranslation(mat4.create(), [
    GALLERY_RIGHT[0] * right, y, GALLERY_RIGHT[1] * right,
  ]);
  return new Float32Array(matrix);
}

export interface ArtGallery {
  readonly instances: readonly RenderInstance[];
  readonly ids: readonly string[];
}

export function createArtGallery(renderer: InstancedRenderer): ArtGallery {
  const instances: RenderInstance[] = [];
  renderer.uploadMesh("gallery-actor-slab", bevelBox(3.75, 0.14, 3.75, 0.06));
  renderer.uploadMesh("gallery-core-slab", bevelBox(8.1, 0.16, 8.1, 0.055));
  for (const id of ARCHETYPE_IDS) {
    const archetype = getArchetype(id);
    renderer.uploadMesh("archetype-" + id, archetype.mesh);
    const horizontal = positions[id];
    const isCore = id === "core";
    instances.push({
      meshId: isCore ? "gallery-core-slab" : "gallery-actor-slab",
      material: "road.primary",
      model: modelAt(horizontal, -0.11),
    });
    instances.push({
      meshId: "archetype-" + id,
      material: "stone.base", // all authored tokens override this fallback.
      model: modelAt(horizontal, 0),
    });
  }
  return { instances, ids: ARCHETYPE_IDS };
}
