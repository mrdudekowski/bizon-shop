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
import { getModelApplicationCategories, getTireCategoryByValue } from "@/lib/catalog/tireCategories";
import { SITEMAP_CONTENT_LIST_ROUTES, SITEMAP_STATIC_ROUTES } from "@/constants/navigation";
import { loadPublished } from "@/lib/content/loadPublished";
import { getSiteUrl } from "@/lib/seo/metadata";

export const dynamic = "force-static";

function publicRouteUrl(siteUrl: string, routePath: string): string {
  const route = new URL(routePath.startsWith("/") ? routePath : `/${routePath}`, siteUrl);
  route.pathname = route.pathname.endsWith("/") ? route.pathname : `${route.pathname}/`;
  return route.href;
}

function listRouteEntry(siteUrl: string, path: string): MetadataRoute.Sitemap[number] {
  return {
    url: publicRouteUrl(siteUrl, path),
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
    url: publicRouteUrl(siteUrl, path),
    changeFrequency: path === "" || path === "/" ? "weekly" : "monthly",
    priority: path === "" || path === "/" ? 1 : 0.7,
  }));

  for (const slug of tireTypeSlugs) {
    entries.push({
      url: publicRouteUrl(siteUrl, `/models/${slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const { tireTypeSlug, models } of tireModelsByType) {
    const categoryValues = Array.from(new Set(models
      .map((model) => getModelApplicationCategories(model)[0]?.value)
      .filter((value): value is string => Boolean(value))));

    for (const categoryValue of categoryValues) {
      const category = getTireCategoryByValue(categoryValue);
      if (!category) continue;
      entries.push({
        url: publicRouteUrl(siteUrl, `/models/${tireTypeSlug}/${category.slug}`),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const model of models) {
      const category = getModelApplicationCategories(model)[0];
      const categoryPath = category ? `/${category.slug}` : "";
      entries.push({
        url: publicRouteUrl(siteUrl, `/models/${tireTypeSlug}${categoryPath}/${model.slug}`),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  const allShopCategorySlugs = new Set(shopCategories.map((category) => category.slug));

  for (const slug of allShopCategorySlugs) {
    entries.push({
      url: publicRouteUrl(siteUrl, `/shop/${slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const slug of wheelTypeSlugs) {
    entries.push({
      url: publicRouteUrl(siteUrl, `/shop/wheels/${slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const route of wheelModelRoutes) {
    entries.push({
      url: publicRouteUrl(siteUrl, `/shop/wheels/${route.wheelTypeSlug}/${route.modelSlug}`),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const slug of productSlugs) {
    entries.push({
      url: publicRouteUrl(siteUrl, `/shop/product/${slug}`),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  if (articleSlugs.length > 0) {
    entries.push(listRouteEntry(siteUrl, SITEMAP_CONTENT_LIST_ROUTES.tireIq));
    for (const slug of articleSlugs) {
      entries.push({
        url: publicRouteUrl(siteUrl, `/tire-iq/${slug}`),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
