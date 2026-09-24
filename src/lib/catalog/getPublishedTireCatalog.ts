import {
  getTireModelsByTypeSlug,
  getTireTypes,
  getTireVariantsByModelId,
} from "@/lib/content/staticCatalog";

import {
  buildTireCatalogReadModel,
  type TireCatalogReadModel,
} from "./tireReadModel";

export async function getPublishedTireCatalog(): Promise<TireCatalogReadModel> {
  return buildTireCatalogReadModel(
    await getTireTypes(),
    getTireModelsByTypeSlug,
    async (modelId) =>
      (await getTireVariantsByModelId(modelId)).map((variant) => variant.size),
  );
}
