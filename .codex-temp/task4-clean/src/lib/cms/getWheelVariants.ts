import { mapWheelVariant } from "./payload/mappers";
import { findPublished } from "./payload/query";
import type { WheelVariant } from "@/payload-types";
import type { CmsWheelVariant } from "./types";
import { getWheelModelsByTypeSlug } from "./getWheelModels";

export async function getWheelVariantsByModelId(modelId: string | number): Promise<CmsWheelVariant[]> {
  const id = typeof modelId === "string" ? Number(modelId) : modelId;
  if (!Number.isFinite(id)) return [];

  const docs = await findPublished("wheel-variants", {
    where: { wheelModel: { equals: id } },
    sort: "sortOrder",
    depth: 0,
  });
  if (!docs?.length) return [];

  return docs.map((doc) => mapWheelVariant(doc as WheelVariant, String(id)));
}

export async function getWheelVariantsByTypeSlug(wheelTypeSlug: string): Promise<CmsWheelVariant[]> {
  const models = await getWheelModelsByTypeSlug(wheelTypeSlug);
  if (models.length === 0) return [];

  const modelIds = models.map((model) => Number(model.id)).filter(Number.isFinite);
  if (modelIds.length === 0) return [];

  const docs = await findPublished("wheel-variants", {
    where: { wheelModel: { in: modelIds } },
    sort: "sortOrder",
    depth: 0,
  });
  if (!docs?.length) return [];

  return docs.map((doc) => mapWheelVariant(doc as WheelVariant));
}
