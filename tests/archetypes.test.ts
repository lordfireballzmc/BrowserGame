import { describe, expect, it } from "vitest";
import {
  ARCHETYPE_IDS, ARCHETYPE_SPEC, combineRigidParts, getArchetype,
} from "../src/art/models/Archetypes";
import { validateGeometry } from "../src/art/mesh/Primitives";
import { MATERIAL_TOKENS } from "../src/engine/render/Palette";

describe("F1.06 authored procedural archetypes", () => {
  it("has four distinct cached original archetypes", () => {
    expect(ARCHETYPE_IDS).toEqual(["warden", "scrapper", "shieldbearer", "core"]);
    for (const id of ARCHETYPE_IDS) {
      const one = getArchetype(id), two = getArchetype(id);
      expect(one).toBe(two);
      expect(one.parts.length).toBeGreaterThan(10);
      expect(one.mesh.indices.length).toBeGreaterThan(36);
      expect(() => validateGeometry(one.mesh)).not.toThrow();
    }
    expect(new Set(ARCHETYPE_IDS.map(id => getArchetype(id).mesh.positions.length)).size)
      .toBeGreaterThan(2);
  });

  it("renders named hierarchical joints with unique names and valid parents", () => {
    for (const id of ARCHETYPE_IDS) {
      const parts = getArchetype(id).parts;
      const visited = new Set<string>();
      for (const part of parts) {
        expect(visited.has(part.name)).toBe(false);
        if (part.parent) expect(visited.has(part.parent)).toBe(true);
        visited.add(part.name);
        expect(part.pivot).toHaveLength(3);
        expect(part.pivot).toEqual(part.position);
      }
    }
  });

  it("holds the expected authored palette signatures in baked vertex materials", () => {
    for (const id of ARCHETYPE_IDS) {
      const slots = new Set(getArchetype(id).mesh.materialIds);
      for (const token of ARCHETYPE_SPEC[id].signature) {
        expect(slots.has(MATERIAL_TOKENS.indexOf(token) + 1)).toBe(true);
      }
      expect(slots.has(0)).toBe(false);
      expect([...slots].every(slot => slot > 0 && slot <= MATERIAL_TOKENS.length)).toBe(true);
    }
  });

  it("keeps a gold 4-sided mantle, blue hood and off-center bolt launcher", () => {
    const hero = getArchetype("warden");
    const names = new Set(hero.parts.map(part => part.name));
    for (const tag of [
      "mantle", "blue-hood", "gold-brow", "launcher-limb", "launcher-bolt",
      "left-leg", "right-leg", "torso", "head",
    ]) expect(names.has(tag)).toBe(true);
    expect(hero.mesh.bounds.min[1]).toBeGreaterThanOrEqual(0);
    expect(hero.mesh.bounds.max[1]).toBeGreaterThan(1.8);
    expect(hero.mesh.bounds.max[1]).toBeLessThan(2.2);
    const launcher = hero.parts.find(part => part.name === "launcher-bolt")!;
    expect(launcher.position[0]).toBeGreaterThan(0.4);
  });

  it("distinguishes the tall spear scrapper from broad shieldbearer", () => {
    const scrapper = getArchetype("scrapper");
    const shield = getArchetype("shieldbearer");
    const spear = scrapper.parts.find(p => p.name === "spear-head")!;
    const mainShield = shield.parts.find(p => p.name === "shield-main")!;
    expect(spear.position[1]).toBeGreaterThan(2);
    expect(scrapper.parts.some(p => p.name === "wedge-hood")).toBe(true);
    expect(shield.parts.some(p => p.name === "shield-kite-tip")).toBe(true);
    expect(mainShield.position[2]).toBeGreaterThan(0.3);
    expect(shield.mesh.bounds.max[0]! - shield.mesh.bounds.min[0]!)
      .toBeGreaterThan(scrapper.mesh.bounds.max[0]! - scrapper.mesh.bounds.min[0]!);
  });

  it("builds 7m-footprint keep with 4 buttresses, gate arch, roof and pennant", () => {
    const core = getArchetype("core");
    const names = core.parts.map(part => part.name);
    expect(names.filter(n => n.startsWith("buttress-") && !n.includes("cap")).length).toBe(4);
    for (const required of [
      "foundation", "wall", "roof-east", "roof-west", "gate-shadow",
      "gate-left", "gate-right", "gate-lintel", "pennant",
    ]) expect(names).toContain(required);
    expect(core.mesh.bounds.min[0]).toBeCloseTo(-3.5, 2);
    expect(core.mesh.bounds.max[0]).toBeCloseTo(3.5, 2);
    expect(core.mesh.bounds.max[1]).toBeGreaterThan(6);
    expect(core.mesh.bounds.max[1]).toBeLessThan(7);
  });

  it("rebuilds exactly the same typed mesh contents from named parts", () => {
    for (const id of ARCHETYPE_IDS) {
      const original = getArchetype(id);
      const copy = combineRigidParts(original.parts);
      expect(copy.positions).toEqual(original.mesh.positions);
      expect(copy.normals).toEqual(original.mesh.normals);
      expect(copy.indices).toEqual(original.mesh.indices);
      expect(copy.materialIds).toEqual(original.mesh.materialIds);
      expect(copy.bounds).toEqual(original.mesh.bounds);
    }
  });

  it("rejects duplicate part names and missing hierarchy parents", () => {
    const original = getArchetype("warden");
    expect(() => combineRigidParts([original.parts[0]!, original.parts[0]!]))
      .toThrow(/unique/);
    expect(() => combineRigidParts([original.parts[1]!]))
      .toThrow(/parent/);
  });
});
