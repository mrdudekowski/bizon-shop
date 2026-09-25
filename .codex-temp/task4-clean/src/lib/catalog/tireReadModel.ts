import { getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import type { CmsTireModel, CmsTireType } from "@/lib/cms/types";

export type TireCatalogModel = CmsTireModel & {
  href: string;
  sizes: string[];
};

export type TireCatalogDirection = CmsTireType & {
  models: TireCatalogModel[];
};

export type TireCatalogReadModel = {
  directions: TireCatalogDirection[];
};

function getModelHref(model: CmsTireModel): string {
  const category = getTireCategoryByValue(model.applicationCategory);
  const categoryPath = category ? `/${category.slug}` : "";
  return `/models/${model.tireTypeSlug}${categoryPath}/${model.slug}`;
}

export async function buildTireCatalogReadModel(
  types: CmsTireType[],
  loadModels: (slug: string) => Promise<CmsTireModel[]>,
  loadSizes: (modelId: string) => Promise<string[]>,
): Promise<TireCatalogReadModel> {
  const directions = await Promise.all(
    types.map(async (type) => {
      const models = await loadModels(type.slug);
      const hydratedModels = await Promise.all(
        models.map(async (model) => ({
          ...model,
          href: getModelHref(model),
          sizes: await loadSizes(model.id),
        })),
      );

      return { ...type, models: hydratedModels };
    }),
  );

  return {
    directions: directions.filter((direction) => direction.models.length > 0),
  };
}
