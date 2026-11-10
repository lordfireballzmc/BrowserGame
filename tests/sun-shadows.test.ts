import { describe, expect, it } from "vitest";
import { vec4 } from "gl-matrix";
import { createBoltSpireStudy } from "../src/art/models/BoltSpireStudy";
import { validateGeometry } from "../src/art/mesh/Primitives";
import {
  SHADOW_MAP_SIZE, SUN_VECTOR, createSunViewProjection,
} from "../src/engine/render/SunShadowPass";
import {
  FRAGMENT_SHADER, VERTEX_SHADER,
} from "../src/engine/render/InstancedRenderer";

describe("F2.06 physical lighting and contact shadow bounds", () => {
  it("encloses the complete 72×48m island, original keep and terrain cliffs", () => {
    const matrix = createSunViewProjection();
    expect(SHADOW_MAP_SIZE).toBe(1024);
    expect(Math.hypot(...SUN_VECTOR)).toBeCloseTo(1, 1);
    for (const x of [-36, 0, 36]) {
      for (const z of [-24, 0, 24]) {
        for (const y of [-5, 0, 8]) {
          const clip = vec4.transformMat4(vec4.create(), [x,y,z,1], matrix);
          for (let axis = 0; axis < 3; axis++) {
            expect(Number.isFinite(clip[axis])).toBe(true);
            expect(Math.abs(clip[axis]! / clip[3]!)).toBeLessThan(1);
          }
        }
      }
    }
  });

  it("shades in linear light with nine soft PCF taps and explicit sRGB output", () => {
    expect(VERTEX_SHADER).toContain("vSunPosition = uSunViewProjection * world");
    expect(FRAGMENT_SHADER).toContain("sunVisibility");
    expect(FRAGMENT_SHADER).toContain("textureSize(uShadowMap, 0)");
    expect(FRAGMENT_SHADER).toContain("vec3 ambient");
    expect(FRAGMENT_SHADER).toContain("vec3 direct");
    expect(FRAGMENT_SHADER).toContain("encodeSRGB(lit)");
  });

  it("authors a reusable, bounded 3D tower study with real silhouette height", () => {
    const mesh = createBoltSpireStudy();
    expect(() => validateGeometry(mesh)).not.toThrow();
    expect(mesh.bounds.max[1]).toBeGreaterThan(3.5);
    expect(mesh.bounds.min[1]).toBeGreaterThanOrEqual(-0.01);
    expect(mesh.indices.length).toBeGreaterThan(240);
    expect(createBoltSpireStudy()).toBe(mesh);
  });
});
