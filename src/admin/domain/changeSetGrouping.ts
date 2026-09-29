import type { ChangeEntry, ChangeSet } from "./types";

export const CHANGESET_IDLE_MS = 30 * 60 * 1000;

export function createChangeSet(author: { id: string; login: string }, now: Date): ChangeSet {
  const stamp = now.toISOString();
  return {
    id: crypto.randomUUID(),
    authorUserId: author.id,
    authorLogin: author.login,
    status: "open",
    createdAt: stamp,
    updatedAt: stamp,
    submittedAt: null,
    reviewedAt: null,
    reviewedByLogin: null,
    reviewComment: null,
    entries: [],
  };
}

export function mergeChangeEntry(pack: ChangeSet, entry: ChangeEntry, now: Date): ChangeSet {
  const existing = pack.entries.find((item) => item.entityType === entry.entityType && item.entityId === entry.entityId);
  if (existing == null) {
    return { ...pack, updatedAt: now.toISOString(), entries: [...pack.entries, entry] };
  }
  const fieldChanges = [...existing.fieldChanges.filter((change) => !entry.fieldChanges.some((next) => next.path === change.path)), ...entry.fieldChanges];
  return {
    ...pack,
    updatedAt: now.toISOString(),
    entries: pack.entries.map((item) =>
      item.id === existing.id
        ? { ...existing, entityTitle: entry.entityTitle, fieldChanges, operation: existing.operation === "create" ? "create" : entry.operation }
        : item,
    ),
  };
}

export function resolveOpenChangeSet({
  existing,
  authorUserId,
  now,
}: {
  existing: ChangeSet[];
  authorUserId: string;
  now: number;
}): ChangeSet | null {
  const open = existing.find(
    (pack) =>
      pack.authorUserId === authorUserId &&
      (pack.status === "open" || pack.status === "returned") &&
      now - Date.parse(pack.updatedAt) < CHANGESET_IDLE_MS,
  );
  return open ?? null;
}
