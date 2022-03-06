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

// Generates a pseudorandom float k with a uniform distribution such that 0.0 <= k < max.
export function rollRatio(max = 1.0): number {
  return Math.random()
}
