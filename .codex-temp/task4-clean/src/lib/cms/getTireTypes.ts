import { mapTireType } from "./payload/mappers";
import { findPublished, findPublishedBySlug, findPublishedSlugs } from "./payload/query";
import type { TireType } from "@/payload-types";
import type { CmsTireType } from "./types";

export async function getTireTypes(): Promise<CmsTireType[]> {
  const docs = await findPublished("tire-types", { sort: "sortOrder" });
  if (!docs?.length) return [];
  return docs.map((doc) => mapTireType(doc as TireType));
}

export async function getTireTypeBySlug(slug: string): Promise<CmsTireType | null> {
  const doc = await findPublishedBySlug("tire-types", slug);
  return doc ? mapTireType(doc as TireType) : null;
}

export async function getAllTireTypeSlugs(): Promise<string[]> {
  return (await findPublishedSlugs("tire-types")) ?? [];
}
