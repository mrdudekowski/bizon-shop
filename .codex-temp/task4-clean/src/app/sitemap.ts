import type { MetadataRoute } from "next";
import {
  getAllPeopleStorySlugs,
  getAllShopProductSlugs,
  getAllShopCategorySlugs,
  getAllTireIQSlugs,
  getAllTireModelRouteParams,
  getAllTireTypeSlugs,
  getAllWheelModelRouteParams,
  getAllWheelTypeSlugs,
} from "@/lib/cms";
import { SITEMAP_CONTENT_LIST_ROUTES, SITEMAP_STATIC_ROUTES } from "@/constants/navigation";
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

  const [productSlugs, tireTypeSlugs, modelRoutes, categorySlugs, articleSlugs, storySlugs, wheelTypeSlugs, wheelModelRoutes] =
    await Promise.all([
      getAllShopProductSlugs(),
      getAllTireTypeSlugs(),
      getAllTireModelRouteParams(),
      getAllShopCategorySlugs(),
      getAllTireIQSlugs(),
      getAllPeopleStorySlugs(),
      getAllWheelTypeSlugs(),
      getAllWheelModelRouteParams(),
    ]);

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

  for (const route of modelRoutes) {
    entries.push({
      url: `${siteUrl}/models/${route.tireTypeSlug}/${route.modelSlug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const slug of categorySlugs) {
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
