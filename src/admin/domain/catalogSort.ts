import type { DocumentStatus } from "./types";

const publicationStatusOrder: Record<DocumentStatus, number> = {
  on_site: 0,
  draft: 1,
  hidden: 2,
};

export function sortModelsByPublicationStatus<T extends { status: DocumentStatus }>(
  models: readonly T[],
): T[] {
  return models
    .map((model, index) => ({ model, index }))
    .sort(
      (left, right) =>
        publicationStatusOrder[left.model.status] - publicationStatusOrder[right.model.status] ||
        left.index - right.index,
    )
    .map(({ model }) => model);
}

export function moveItemInList<T>(
  items: readonly T[],
  index: number,
  delta: -1 | 1,
): T[] | null {
  const targetIndex = index + delta;
  if (index < 0 || index >= items.length || targetIndex < 0 || targetIndex >= items.length) {
    return null;
  }
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}
