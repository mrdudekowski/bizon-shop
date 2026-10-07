import type { MetadataRoute } from "next";
import {
  getAllShopProductSlugs,
  getShopCategories,
  getAllTireIQSlugs,
  getAllTireTypeSlugs,
  getTireModelsByTypeSlug,
  getAllWheelModelRouteParams,
  getAllWheelTypeSlugs,
} from "@/lib/content";
import { TIRE_CATEGORIES, getModelApplicationCategories, getModelApplicationValues, getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import { SITEMAP_CONTENT_LIST_ROUTES, SITEMAP_STATIC_ROUTES } from "@/constants/navigation";
import { loadPublished } from "@/lib/content/loadPublished";
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

  const loaded = await loadPublished(async () => {
    const [productSlugs, shopCategories, tireTypeSlugs, articleSlugs, wheelTypeSlugs, wheelModelRoutes] =
      await Promise.all([
        getAllShopProductSlugs(),
        getShopCategories(),
        getAllTireTypeSlugs(),
        getAllTireIQSlugs(),
        getAllWheelTypeSlugs(),
        getAllWheelModelRouteParams(),
      ]);

    const tireModelsByType = await Promise.all(
      tireTypeSlugs.map(async (tireTypeSlug) => ({
        tireTypeSlug,
        models: await getTireModelsByTypeSlug(tireTypeSlug),
      })),
    );
    return { productSlugs, shopCategories, tireTypeSlugs, articleSlugs, wheelTypeSlugs, wheelModelRoutes, tireModelsByType };
  });
  const {
    productSlugs,
    shopCategories,
    tireTypeSlugs,
    articleSlugs,
    wheelTypeSlugs,
    wheelModelRoutes,
    tireModelsByType,
  } = loaded.kind === "ok"
    ? loaded.value
    : {
        productSlugs: [],
        shopCategories: [],
        tireTypeSlugs: [],
        articleSlugs: [],
        wheelTypeSlugs: [],
        wheelModelRoutes: [],
        tireModelsByType: [],
      };

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
      : Array.from(new Set(models.flatMap((model) => getModelApplicationValues(model))));

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
      const category = getModelApplicationCategories(model)[0];
      const categoryPath = category ? `/${category.slug}` : "";
      entries.push({
        url: `${siteUrl}/models/${tireTypeSlug}${categoryPath}/${model.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  const allShopCategorySlugs = new Set(shopCategories.map((category) => category.slug));

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

  return entries;
}
