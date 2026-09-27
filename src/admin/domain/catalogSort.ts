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
