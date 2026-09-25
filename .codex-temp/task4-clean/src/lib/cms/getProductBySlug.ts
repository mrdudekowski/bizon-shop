import { mapProduct } from "./payload/mappers";
import { findPublishedBySlug } from "./payload/query";
import type { Product } from "@/payload-types";
import type { CmsProduct } from "./types";

export async function getShopProductBySlug(slug: string): Promise<CmsProduct | null> {
  const doc = await findPublishedBySlug("products", slug);
  return doc ? mapProduct(doc as Product) : null;
}
