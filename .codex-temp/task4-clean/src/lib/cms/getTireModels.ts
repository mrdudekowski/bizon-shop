import { mapTireModelDetail, resolveRelationSlug } from "./payload/mappers";
import { findPublished, findPublishedBySlug } from "./payload/query";
import type { TireModel } from "@/payload-types";
import type { CmsTireModel, TireModelRouteParam } from "./types";

export async function getTireModelsByTypeSlug(tireTypeSlug: string): Promise<CmsTireModel[]> {
  const normalized = tireTypeSlug?.trim().toLowerCase();
  if (!normalized) return [];

  const typeDoc = await findPublishedBySlug("tire-types", normalized);
  if (!typeDoc) return [];

  const docs = await findPublished("tire-models", {
    where: { tireType: { equals: typeDoc.id } },
    depth: 1,
  });
  if (!docs?.length) return [];

  const models = docs.map((doc) => mapTireModelDetail(doc as TireModel));
  const modelsWithPublishedVariants: CmsTireModel[] = [];

  // ponytail: N+1 is acceptable for the small catalog; replace with aggregation if it grows.
  for (const model of models) {
    const variants = await findPublished("tire-variants", {
      where: { tireModel: { equals: model.id } },
      limit: 1,
    });
    if (variants?.length) modelsWithPublishedVariants.push(model);
  }

  return modelsWithPublishedVariants;
}

export async function getTireModelByTypeAndSlug(
  tireTypeSlug: string,
  modelSlug: string,
): Promise<CmsTireModel | null> {
  const normalizedType = tireTypeSlug?.trim().toLowerCase();
  const doc = await findPublishedBySlug("tire-models", modelSlug);
  if (!doc) return null;

  const model = mapTireModelDetail(doc as TireModel);
  return model.tireTypeSlug === normalizedType ? model : null;
}

export async function getAllTireModelRouteParams(): Promise<TireModelRouteParam[]> {
  const docs = await findPublished("tire-models", { depth: 1 });
  if (!docs?.length) return [];

  return docs
    .map((doc) => {
      const tireTypeSlug = resolveRelationSlug((doc as TireModel).tireType);
      const modelSlug = "slug" in doc && typeof doc.slug === "string" ? doc.slug : null;
      if (!tireTypeSlug || !modelSlug) return null;
      return { tireTypeSlug, modelSlug };
    })
    .filter((item): item is TireModelRouteParam => Boolean(item));
}
