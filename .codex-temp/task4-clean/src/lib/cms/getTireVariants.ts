import { mapTireVariant } from "./payload/mappers";
import { findPublished } from "./payload/query";
import type { TireVariant } from "@/payload-types";
import type { CmsTireVariant } from "./types";

export async function getTireVariantsByModelId(modelId: string | number): Promise<CmsTireVariant[]> {
  const id = typeof modelId === "string" ? Number(modelId) : modelId;
  if (!Number.isFinite(id)) return [];

  const docs = await findPublished("tire-variants", {
    where: { tireModel: { equals: id } },
    sort: "sortOrder",
    depth: 0,
  });

  if (!docs || docs.length === 0) return [];

  return docs.map((doc) => mapTireVariant(doc as TireVariant));
}
