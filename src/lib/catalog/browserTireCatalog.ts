import { getModelHref, type TireCatalogDirection, type TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { CmsTireModel, CmsTireType } from "@/lib/content/types";
import { fetchBrowserPublishedJson, fetchBrowserPublishedList } from "@/lib/content/browserPublishedClient";

export async function fetchBrowserTireCatalog(signal?: AbortSignal): Promise<TireCatalogReadModel> {
  const types = await fetchBrowserPublishedList<CmsTireType>("/v1/tires/types", signal);
  const directions = await Promise.all(types.map(async (type) => {
    const models = await fetchBrowserPublishedList<CmsTireModel>(
      `/v1/tires/types/${encodeURIComponent(type.slug)}/models`,
      signal,
    );
    return {
      ...type,
      models: models.map((model) => ({ ...model, href: getModelHref(model), sizes: [] })),
    };
  }));
  return { directions };
}

export async function fetchBrowserTireDirection(slug: string, signal?: AbortSignal): Promise<TireCatalogDirection> {
  const [type, models] = await Promise.all([
    fetchBrowserPublishedJson<CmsTireType>(`/v1/tires/types/${encodeURIComponent(slug)}`, signal),
    fetchBrowserPublishedList<CmsTireModel>(`/v1/tires/types/${encodeURIComponent(slug)}/models`, signal),
  ]);
  return {
    ...type,
    models: models.map((model) => ({ ...model, href: getModelHref(model), sizes: [] })),
  };
}
