type ImageListItem = { id: string; imageAssetId: string | null };
type ImageRecord = { draft: { mainImage?: { assetId: string } } };

export async function hydrateMissingImageAssetIds<T extends ImageListItem>(
  items: T[],
  loadRecord: (id: string) => Promise<ImageRecord>,
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.imageAssetId) return item;

      try {
        const record = await loadRecord(item.id);
        return { ...item, imageAssetId: record.draft.mainImage?.assetId ?? null };
      } catch {
        return item;
      }
    }),
  );
}
