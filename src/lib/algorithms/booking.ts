export type BundleCount = { size: number; count: number };

// Fewest bundles whose sizes add up to exactly groupSize (bundles can be reused).
// Returns null when no exact combination exists.
//
// fewest[n] = fewest bundles needed to make exactly n seats.
// fewest[n] = 1 + min(fewest[n - size]) over every bundle size that fits.
export function minBundles(bundleSizes: number[], groupSize: number): BundleCount[] | null {
  const fewest: number[] = new Array(groupSize + 1).fill(Infinity);
  const lastBundle: number[] = new Array(groupSize + 1).fill(0);
  fewest[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of bundleSizes) {
      if (size > seats) continue;
      if (fewest[seats - size] + 1 < fewest[seats]) {
        fewest[seats] = fewest[seats - size] + 1;
        lastBundle[seats] = size;
      }
    }
  }

  if (fewest[groupSize] === Infinity) return null;

  // Walk back from groupSize using the bundle chosen at each step.
  const counts = new Map<number, number>();
  for (let seats = groupSize; seats > 0; seats -= lastBundle[seats]) {
    counts.set(lastBundle[seats], (counts.get(lastBundle[seats]) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);
}
