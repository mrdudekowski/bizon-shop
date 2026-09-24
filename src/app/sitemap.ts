import type { MetadataRoute } from "next";
import {
  getAllPeopleStorySlugs,
  getAllShopProductSlugs,
  getShopProducts,
  getAllTireIQSlugs,
  getAllTireTypeSlugs,
  getTireModelsByTypeSlug,
  getAllWheelModelRouteParams,
  getAllWheelTypeSlugs,
} from "@/lib/content";
import { TIRE_CATEGORIES, getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import { SITEMAP_CONTENT_LIST_ROUTES, SITEMAP_STATIC_ROUTES } from "@/constants/navigation";
import { SHOP_LIFESTYLE_CATEGORIES } from "@/constants/shopCategories";
import { getSiteUrl } from "@/lib/seo/metadata";

function listRouteEntry(path: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${getSiteUrl()}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [productSlugs, shopProducts, tireTypeSlugs, articleSlugs, storySlugs, wheelTypeSlugs, wheelModelRoutes] =
    await Promise.all([
      getAllShopProductSlugs(),
      getShopProducts(),
      getAllTireTypeSlugs(),
      getAllTireIQSlugs(),
      getAllPeopleStorySlugs(),
      getAllWheelTypeSlugs(),
      getAllWheelModelRouteParams(),
    ]);

  const tireModelsByType = await Promise.all(
    tireTypeSlugs.map(async (tireTypeSlug) => ({
      tireTypeSlug,
      models: await getTireModelsByTypeSlug(tireTypeSlug),
    })),
  );

  const entries: MetadataRoute.Sitemap = SITEMAP_STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/" ? "weekly" : "monthly",
    priority: path === "" || path === "/" ? 1 : 0.7,
  }));

  for (const slug of tireTypeSlugs) {
    entries.push({
      url: `${siteUrl}/models/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const { tireTypeSlug, models } of tireModelsByType) {
    const categoryValues = tireTypeSlug === "tbr"
      ? TIRE_CATEGORIES.map((category) => category.value)
      : Array.from(new Set(models.map((model) => model.applicationCategory)));

    for (const categoryValue of categoryValues) {
      const category = getTireCategoryByValue(categoryValue);
      if (!category) continue;
      entries.push({
        url: `${siteUrl}/models/${tireTypeSlug}/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const model of models) {
      const category = getTireCategoryByValue(model.applicationCategory);
      const categoryPath = category ? `/${category.slug}` : "";
      entries.push({
        url: `${siteUrl}/models/${tireTypeSlug}${categoryPath}/${model.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  const allShopCategorySlugs = new Set([
    ...SHOP_LIFESTYLE_CATEGORIES.map((category) => category.slug),
    ...shopProducts.map((product) => product.categorySlug).filter(Boolean),
  ]);

  for (const slug of allShopCategorySlugs) {
    entries.push({
      url: `${siteUrl}/shop/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const slug of wheelTypeSlugs) {
    entries.push({
      url: `${siteUrl}/shop/wheels/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const route of wheelModelRoutes) {
    entries.push({
      url: `${siteUrl}/shop/wheels/${route.wheelTypeSlug}/${route.modelSlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const slug of productSlugs) {
    entries.push({
      url: `${siteUrl}/shop/product/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  if (articleSlugs.length > 0) {
    entries.push(listRouteEntry(SITEMAP_CONTENT_LIST_ROUTES.tireIq));
    for (const slug of articleSlugs) {
      entries.push({
        url: `${siteUrl}/tire-iq/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  if (storySlugs.length > 0) {
    entries.push(listRouteEntry(SITEMAP_CONTENT_LIST_ROUTES.peopleStories));
    for (const slug of storySlugs) {
      entries.push({
        url: `${siteUrl}/people-stories/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
