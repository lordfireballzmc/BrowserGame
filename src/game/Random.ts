/**
 * Bastionfall deterministic PRNG version 1: xorshift32.
 *
 * This is for gameplay and procedural generation, not cryptography.
 * The exact 32-bit sequence is a save/replay compatibility contract.
 */
export const RNG_VERSION = 1;
const FALLBACK_NONZERO_STATE = 0x6d2b79f5;
const U32_RANGE = 0x1_0000_0000;

/** UTF-16 FNV-1a is deliberately specified to make string seeds portable across browsers. */
export function seedToUint32(seed: number | string): number {
  if (typeof seed === "number") {
    if (!Number.isSafeInteger(seed)) throw new RangeError("Seed must be a safe integer");
    return seed >>> 0;
  }
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state = seedToUint32(seed) || FALLBACK_NONZERO_STATE;
  }

  /** Uniform 32-bit integer, in the interval 0..2^32-1. */
  nextUint32(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  /** [0, 1), derived from exactly one PRNG draw. */
  nextFloat(): number {
    return this.nextUint32() / U32_RANGE;
  }

  /**
   * Inclusive integer bounds. Rejection sampling avoids modulo bias.
   * Supports ranges up to the full 2^32 domain.
   */
  nextIntInclusive(min: number, max: number): number {
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)
      || min > max || max - min + 1 > U32_RANGE) {
      throw new RangeError("Invalid inclusive integer range");
    }
    const width = max - min + 1;
    const upperExclusive = Math.floor(U32_RANGE / width) * width;
    let draw: number;
    do {
      draw = this.nextUint32();
    } while (draw >= upperExclusive);
    return min + (draw % width);
  }

  /** Snapshot state for deterministic saves and test replay. */
  snapshot(): number {
    return this.state;
  }

  /** Restores a state from a prior snapshot, never accepts xorshift's absorbing zero. */
  restore(state: number): void {
    if (!Number.isSafeInteger(state) || state <= 0 || state > 0xffff_ffff) {
      throw new RangeError("Invalid PRNG snapshot");
    }
    this.state = state >>> 0;
  }
}
