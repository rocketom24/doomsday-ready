// bundleSizes is stored as a JSON string in SQLite; the API only exposes arrays.
// Returns null for malformed data so one bad row cannot break a whole endpoint.
export function parseBundleSizes(json: string): number[] | null {
  try {
    const value: unknown = JSON.parse(json);
    if (Array.isArray(value) && value.length > 0 && value.every((n) => Number.isInteger(n) && n > 0)) {
      return value as number[];
    }
  } catch {
    // fall through
  }
  return null;
}
