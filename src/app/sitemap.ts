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
import { ROUTES, SITEMAP_CONTENT_LIST_ROUTES, SITEMAP_STATIC_ROUTES } from "@/constants/navigation";
import { getPublishedStubOverlay } from "@/lib/content/getPageContent";
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

const OPTIONAL_CMS_PAGE_ROUTES = [
  { path: ROUTES.contact, key: "contact" },
  { path: ROUTES.warranty, key: "warranty" },
  { path: ROUTES.about, key: "about" },
  { path: ROUTES.supplier, key: "become-a-supplier" },
  { path: ROUTES.branding, key: "branding" },
  { path: ROUTES.privacyPolicy, key: "privacy-policy" },
  { path: ROUTES.shopDeliveryAndReturns, key: "shop-delivery-returns" },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const loaded = await loadPublished(async () => {
    const [productSlugs, shopCategories, tireTypeSlugs, articleSlugs, wheelTypeSlugs, wheelModelRoutes, optionalPages] =
      await Promise.all([
        getAllShopProductSlugs(),
        getShopCategories(),
        getAllTireTypeSlugs(),
        getAllTireIQSlugs(),
        getAllWheelTypeSlugs(),
        getAllWheelModelRouteParams(),
        Promise.all(OPTIONAL_CMS_PAGE_ROUTES.map(async ({ path, key }) => ({
          path,
          page: await getPublishedStubOverlay(key),
        }))),
      ]);

    const tireModelsByType = await Promise.all(
      tireTypeSlugs.map(async (tireTypeSlug) => ({
        tireTypeSlug,
        models: await getTireModelsByTypeSlug(tireTypeSlug),
      })),
    );
    return {
      productSlugs,
      shopCategories,
      tireTypeSlugs,
      articleSlugs,
      wheelTypeSlugs,
      wheelModelRoutes,
      tireModelsByType,
      optionalPagePaths: optionalPages.filter(({ page }) => page !== null).map(({ path }) => path),
    };
  });
  const publishedOptionalPagePaths = loaded.kind === "ok" ? new Set(loaded.value.optionalPagePaths) : null;
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

  const staticRoutes = publishedOptionalPagePaths
    ? SITEMAP_STATIC_ROUTES.filter((path) => {
        const isOptionalCmsPage = OPTIONAL_CMS_PAGE_ROUTES.some((page) => page.path === path);
        return !isOptionalCmsPage || publishedOptionalPagePaths.has(path);
      })
    : SITEMAP_STATIC_ROUTES;
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
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
