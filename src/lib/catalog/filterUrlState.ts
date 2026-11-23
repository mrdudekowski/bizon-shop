/**
 * Updates only the named catalog filter parameters. Tracking and other query
 * parameters stay intact when a visitor changes or clears catalog filters.
 */
export function patchFilterSearchParams(
  current: URLSearchParams,
  filterKeys: readonly string[],
  values: Record<string, string | undefined>,
): string {
  const next = new URLSearchParams(current);

  for (const key of filterKeys) {
    const value = values[key]?.trim();
    if (value) next.set(key, value);
    else next.delete(key);
  }

  return next.toString();
}
