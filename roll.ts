// Generates a pseudorandom integer k with a uniform distribution such that 0 <= k < n.
export function rollInt(n: number): number {
  // I'm unsure of any practical limits on n, so any integer is assumed to allow a uniform
  // distribution of numbers in the range to be generated.
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error('Expected positive integer.')
  }
  return Math.floor(rollRatio() * n)
}

// Generates a pseudorandom integer k with a uniform distribution such that low <= k <= high.
export function rollRange(low: number, high: number): number {
  return rollInt(high - low + 1) + low
}

// Generates a pseudorandom float k with a uniform distribution such that 0.0 <= k < 1.
export function rollRatio(): number {
  return Math.random()
}

// Generates a pseudorandom float k with a uniform distribution such that min <= k < max.
export function rollUniform(min: number, max: number): number {
  return min + rollRatio() * (max - min)
}
