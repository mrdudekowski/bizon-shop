import { mapShopCategory } from "./payload/mappers";
import { findPublished, findPublishedBySlug, findPublishedSlugs } from "./payload/query";
import type { ShopCategory } from "@/payload-types";
import type { CmsShopCategory } from "./types";

export async function getShopCategories(): Promise<CmsShopCategory[]> {
  const docs = await findPublished("shop-categories", { sort: "sortOrder" });
  if (!docs?.length) return [];
  return docs.map((doc) => mapShopCategory(doc as ShopCategory));
}

export async function getShopCategoryBySlug(slug: string): Promise<CmsShopCategory | null> {
  const doc = await findPublishedBySlug("shop-categories", slug);
  return doc ? mapShopCategory(doc as ShopCategory) : null;
}

export async function getAllShopCategorySlugs(): Promise<string[]> {
  return (await findPublishedSlugs("shop-categories")) ?? [];
}
