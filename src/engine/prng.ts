/**
 * High-performance deterministic PRNG and fast checksum calculator
 * Based on Mulberry32 with SplitMix32 seed initialization.
 * Guarantees 100% reproducible data across repeated executions with identical seed.
 */

export class DeterministicPRNG {
  private state: number;

  constructor(seed: number = 20261022) {
    this.state = seed >>> 0;
  }

  // Returns pseudo-random float in [0, 1)
  nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Integer in range [min, max] inclusive
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  // Pick one element from array deterministically
  choice<T>(items: T[]): T {
    const idx = this.nextInt(0, items.length - 1);
    return items[idx];
  }

  // Standard normal distribution via Box-Muller transform
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    let u1 = this.nextFloat();
    let u2 = this.nextFloat();
    while (u1 <= 1e-15) u1 = this.nextFloat(); // avoid log(0)
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

/**
 * FNV-1a 32-bit hashing algorithm to generate deterministic checksums of strings or data dumps.
 */
export function calculateChecksum(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}
