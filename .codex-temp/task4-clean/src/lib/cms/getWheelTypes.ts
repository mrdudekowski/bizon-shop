import { mapWheelType } from "./payload/mappers";
import { findPublished, findPublishedBySlug, findPublishedSlugs } from "./payload/query";
import type { WheelType } from "@/payload-types";
import type { CmsWheelType } from "./types";

export async function getWheelTypes(): Promise<CmsWheelType[]> {
  const docs = await findPublished("wheel-types", { sort: "sortOrder" });
  if (!docs?.length) return [];
  return docs.map((doc) => mapWheelType(doc as WheelType));
}

export async function getWheelTypeBySlug(slug: string): Promise<CmsWheelType | null> {
  const doc = await findPublishedBySlug("wheel-types", slug);
  return doc ? mapWheelType(doc as WheelType) : null;
}

export async function getAllWheelTypeSlugs(): Promise<string[]> {
  return (await findPublishedSlugs("wheel-types")) ?? [];
}
