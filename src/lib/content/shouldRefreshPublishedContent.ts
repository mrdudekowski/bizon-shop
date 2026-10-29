const REVISION = /^sha256:[a-f0-9]{64}$/;

function revisionOf(value: unknown): string | null {
  if (value == null || typeof value !== "object") return null;
  const record = value as { schema?: unknown; revision?: unknown };
  if (record.schema !== 1 || typeof record.revision !== "string" || !REVISION.test(record.revision)) return null;
  return record.revision;
}

export function shouldRefreshPublishedContent(built: unknown, live: unknown): boolean {
  const baked = revisionOf(built);
  const current = revisionOf(live);
  if (baked == null || current == null) return false;
  return baked !== current;
}
