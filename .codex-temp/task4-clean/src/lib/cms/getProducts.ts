import { mapProduct } from "./payload/mappers";
import { findPublished, findPublishedBySlug } from "./payload/query";
import type { Product } from "@/payload-types";
import type { CmsProduct } from "./types";

type ShopProductsOptions = {
  categorySlug?: string;
};

export async function getShopProducts(options: ShopProductsOptions = {}): Promise<CmsProduct[]> {
  const { categorySlug } = options;

  if (categorySlug) {
    const category = await findPublishedBySlug("shop-categories", categorySlug);
    if (!category) return [];

    const docs = await findPublished("products", {
      where: { shopCategory: { equals: category.id } },
      depth: 1,
    });
    if (!docs?.length) return [];
    return docs.map((doc) => mapProduct(doc as Product));
  }

  const docs = await findPublished("products", { depth: 1 });
  if (!docs?.length) return [];
  return docs.map((doc) => mapProduct(doc as Product));
}

export async function getShopProductsByCategorySlug(categorySlug: string): Promise<CmsProduct[]> {
  return getShopProducts({ categorySlug });
}

export async function getAllShopProductSlugs(): Promise<string[]> {
  const docs = await findPublished("products", {
    depth: 0,
    select: { slug: true },
  });
  if (!docs?.length) return [];

  return docs
    .map((doc) => ("slug" in doc && typeof doc.slug === "string" ? doc.slug : null))
    .filter((slug): slug is string => Boolean(slug));
}
