/**
 * F2.04 — authored northern decorative river corridor.
 *
 * The river is strictly scenery; no pathfinding/alternate enemy lane is added.
 * This coordinate-only module can be imported by Island.ts without depending
 * on terrain meshes. The water runs west–east along the north map edge.
 */
export const RIVER_SPEC = Object.freeze({
  startX: -33,
  endX: 33,
  bankFeatherMeters: 2.05,
  waterHalfWidthMeters: 1.5,
  carveMarginMeters: 0.15,
  maximumCarveMeters: 0.72,
  waterHeightMeters: -0.32,
  sampleStepMeters: 1,
  bridgeXs: [-16, 16] as readonly number[],
});

const smooth = (t: number): number => t * t * (3 - 2 * t);
const clamp = (v: number): number => Math.max(0, Math.min(1, v));

/** Fixed designer-authored gentle bend, not seed-dependent gameplay terrain. */
export function riverCenterZ(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError("River X must be finite");
  return 19 + 0.45 * Math.sin((x + 3) / 9);
}

/** Narrow pointed ends inside the northern island coastline. */
export function riverTipScale(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError("River X must be finite");
  return 0.08 + 0.92 * smooth(clamp((33 - Math.abs(x)) / 3));
}

export function riverHalfWidth(x: number): number {
  return RIVER_SPEC.waterHalfWidthMeters * riverTipScale(x);
}

export function riverOuterBankWidth(x: number): number {
  return riverHalfWidth(x) + (RIVER_SPEC.carveMarginMeters
    + RIVER_SPEC.bankFeatherMeters) * riverTipScale(x);
}

/**
 * The bank's globally sampled terrain cut. Water always sits above the river
 * bed and below its carved stone banks. Fades off after the visible endpoints.
 */
export function riverCarveDepth(x: number, z: number): number {
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    throw new RangeError("River coordinates must be finite");
  }
  const fadeX = smooth(clamp((34 - Math.abs(x)) / 1));
  if (fadeX === 0) return 0;
  const d = Math.abs(z - riverCenterZ(x));
  const inner = riverHalfWidth(x) + RIVER_SPEC.carveMarginMeters * riverTipScale(x);
  const outer = riverOuterBankWidth(x);
  const t = clamp((outer - d) / (outer - inner));
  return RIVER_SPEC.maximumCarveMeters * fadeX * smooth(t);
}

export function riverWaterContains(x: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    throw new RangeError("River coordinates must be finite");
  }
  return x >= RIVER_SPEC.startX && x <= RIVER_SPEC.endX
    && Math.abs(z - riverCenterZ(x)) <= riverHalfWidth(x);
}
