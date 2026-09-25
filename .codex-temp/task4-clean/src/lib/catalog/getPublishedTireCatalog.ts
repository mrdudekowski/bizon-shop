import { getTireModelsByTypeSlug } from "@/lib/cms/getTireModels";
import { getTireTypes } from "@/lib/cms/getTireTypes";
import { getTireVariantsByModelId } from "@/lib/cms/getTireVariants";

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
