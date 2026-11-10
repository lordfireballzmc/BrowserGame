/** Exact sRGB palette from docs/03_ART_AND_ANIMATION_BIBLE.md. */
export const PALETTE = {
  "grass.primary": "#63976B",
  "grass.shadow": "#497555",
  "grass.dry": "#A0A770",
  "road.primary": "#D7BF91",
  "road.rut": "#B89A6B",
  "earth.cut": "#816E58",
  "stone.base": "#7E898C",
  "stone.shadow": "#57656B",
  "stone.highlight": "#A8AEAC",
  "timber.base": "#73533F",
  "timber.light": "#A27A4D",
  "defender.blue": "#466D88",
  "defender.gold": "#D8B459",
  "enemy.red": "#AA473A",
  "enemy.dark": "#673D39",
  metal: "#78868D",
  copper: "#D9A34B",
  "accent.warning": "#D77750",
  ink: "#243338",
  ivory: "#F3E8CE",
  water: "#6B9AA1",
} as const;

export type MaterialToken = keyof typeof PALETTE;
export const MATERIAL_TOKENS = Object.freeze(Object.keys(PALETTE) as MaterialToken[]);

export type LinearRgb = readonly [number, number, number];

/** IEC 61966-2-1 transfer curve: convert palette sRGB to linear-light. */
export function srgbChannelToLinear(channel: number): number {
  if (!Number.isFinite(channel) || channel < 0 || channel > 1) {
    throw new RangeError("sRGB channel must be finite and between 0 and 1");
  }
  return channel <= 0.04045 ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function linearColor(token: MaterialToken): LinearRgb {
  const hex = PALETTE[token];
  const channel = (offset: number) => srgbChannelToLinear(
    Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  return [channel(1), channel(3), channel(5)];
}

/**
 * Geometry material slot 0 inherits the instance's semantic material.
 * IDs 1..21 override with the matching MATERIAL_TOKENS[ID-1]. An unknown
 * palette slot is rejected instead of silently becoming an arbitrary color.
 */
export function vertexMaterialColor(slot: number): LinearRgb | null {
  if (!Number.isInteger(slot) || slot < 0 || slot > MATERIAL_TOKENS.length) {
    throw new RangeError("Geometry material slot has no defined palette token: " + slot);
  }
  if (slot === 0) return null;
  return linearColor(MATERIAL_TOKENS[slot - 1]!);
}
