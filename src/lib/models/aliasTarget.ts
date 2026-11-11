/** Returns the canonical model URL when the requested URL is an alias. */
export function tireModelAliasTarget(requestedPath: string, canonicalHref?: string): string | null {
  if (!canonicalHref || requestedPath === canonicalHref) return null;
  return canonicalHref;
}
