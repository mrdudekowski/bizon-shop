import { mapWheelModelDetail, resolveRelationSlug } from "./payload/mappers";
import { findPublished, findPublishedBySlug } from "./payload/query";
import type { WheelModel } from "@/payload-types";
import type { CmsWheelModel, WheelModelRouteParam } from "./types";

export async function getWheelModelsByTypeSlug(wheelTypeSlug: string): Promise<CmsWheelModel[]> {
  const normalized = wheelTypeSlug?.trim().toLowerCase();
  if (!normalized) return [];

  const typeDoc = await findPublishedBySlug("wheel-types", normalized);
  if (!typeDoc) return [];

  const docs = await findPublished("wheel-models", {
    where: { wheelType: { equals: typeDoc.id } },
    depth: 1,
  });
  if (!docs?.length) return [];
  return docs.map((doc) => mapWheelModelDetail(doc as WheelModel));
}

export async function getWheelModelByTypeAndSlug(
  wheelTypeSlug: string,
  modelSlug: string,
): Promise<CmsWheelModel | null> {
  const normalizedType = wheelTypeSlug?.trim().toLowerCase();
  const doc = await findPublishedBySlug("wheel-models", modelSlug);
  if (!doc) return null;

  const model = mapWheelModelDetail(doc as WheelModel);
  return model.wheelTypeSlug === normalizedType ? model : null;
}

export async function getAllWheelModelRouteParams(): Promise<WheelModelRouteParam[]> {
  const docs = await findPublished("wheel-models", { depth: 1 });
  if (!docs?.length) return [];

  return docs
    .map((doc) => {
      const wheelTypeSlug = resolveRelationSlug((doc as WheelModel).wheelType);
      const modelSlug = "slug" in doc && typeof doc.slug === "string" ? doc.slug : null;
      if (!wheelTypeSlug || !modelSlug) return null;
      return { wheelTypeSlug, modelSlug };
    })
    .filter((item): item is WheelModelRouteParam => Boolean(item));
}
