import { mapTireIQArticle } from "./payload/mappers";
import { findPublished, findPublishedBySlug, findPublishedSlugs } from "./payload/query";
import type { TireIqArticle } from "@/payload-types";
import type { CmsArticle } from "./types";

export async function getTireIQArticles(): Promise<CmsArticle[]> {
  const docs = await findPublished("tire-iq-articles", { sort: "-publishedAt" });
  if (!docs?.length) return [];
  return docs.map((doc) => mapTireIQArticle(doc as TireIqArticle));
}

export async function getTireIQArticleBySlug(slug: string): Promise<CmsArticle | null> {
  const doc = await findPublishedBySlug("tire-iq-articles", slug);
  return doc ? mapTireIQArticle(doc as TireIqArticle) : null;
}

export async function getAllTireIQSlugs(): Promise<string[]> {
  return (await findPublishedSlugs("tire-iq-articles")) ?? [];
}
