export type PendingMediaReplacement = { targetMediaId: string; stagedMediaId: string };

export function collectPendingMediaReplacements(value: unknown): PendingMediaReplacement[] {
  const replacements = new Map<string, string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (node == null || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (typeof record.assetId === "string" && typeof record.replacementAssetId === "string") {
      if (!replacements.has(record.assetId)) replacements.set(record.assetId, record.replacementAssetId);
    }
    for (const child of Object.values(record)) visit(child);
  };
  visit(value);
  return [...replacements].map(([targetMediaId, stagedMediaId]) => ({ targetMediaId, stagedMediaId }));
}
