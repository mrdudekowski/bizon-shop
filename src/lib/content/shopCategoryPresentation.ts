import { ROUTES } from "@/constants/navigation";
import { getShopLifestyleCategory } from "@/constants/shopCategories";
import type { CmsShopCategory } from "./types";
import type { ShopCatalogTile } from "./pages/types";

export type ShopCategoryPageView = "catalog" | "lifestyle" | "not-found";

export function shopCategoryPageView(
  hasPublishedCmsCategory: boolean,
  hasLifestyleFallback: boolean,
): ShopCategoryPageView {
  if (hasPublishedCmsCategory) return "catalog";
  return hasLifestyleFallback ? "lifestyle" : "not-found";
}

export function shopCategoryLabel(category: Pick<CmsShopCategory, "slug" | "name">): string {
  return category.name;
}

export function shopProductCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}

export function shopCategoryNavLinks(categories: readonly CmsShopCategory[]): { href: string; label: string }[] {
  return [
    ...categories
      .filter((category) => category.showInMenu)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        href: `${ROUTES.shop}/${category.slug}`,
        label: shopCategoryLabel(category),
      })),
    { href: ROUTES.shopCategories, label: "Все категории" },
  ];
}

function toIndexCard(category: Pick<CmsShopCategory, "slug" | "name" | "imageUrl">) {
  const lifestyle = getShopLifestyleCategory(category.slug);
  const desktopImage = category.imageUrl || lifestyle?.desktopImage || "";
  const mobileImage = category.imageUrl || lifestyle?.mobileImage || desktopImage;

  return {
    slug: category.slug,
    kicker: "",
    title: category.name,
    href: `${ROUTES.shop}/${category.slug}`,
    desktopImage,
    mobileImage,
    imageAlt: category.imageUrl ? category.name : lifestyle?.imageAlt ?? category.name,
  };
}

export type ShopHomeCategoryCard = {
  slug: string;
  title: string;
  href: string;
  iconUrl: string | null;
};

export function shopHomeCategoryCards(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
): ShopHomeCategoryCard[] {
  if (tiles && tiles.length > 0) {
    const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
    return tiles
      .filter((tile) => tile.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((tile) => {
        const category = categoriesBySlug.get(tile.categorySlug);
        if (!category) return [];
        return [{
          slug: category.slug,
          title: tile.title || category.name,
          href: `${ROUTES.shop}/${category.slug}`,
          iconUrl: tile.iconUrl ?? null,
        }];
      });
  }

  return categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      slug: category.slug,
      title: category.name,
      href: `${ROUTES.shop}/${category.slug}`,
      iconUrl: category.imageUrl ?? null,
    }));
}

export type ShopHomeCarouselSlide = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
};

export function shopHomeCarouselSlides(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
): ShopHomeCarouselSlide[] {
  if (tiles && tiles.length > 0) {
    const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
    return tiles
      .filter((tile) => tile.carouselVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((tile) => {
        const category = categoriesBySlug.get(tile.categorySlug);
        if (!category) return [];
        return [{
          id: category.slug,
          title: tile.title || category.name,
          href: `${ROUTES.shop}/${category.slug}`,
          imageUrl: tile.carouselImageUrl ?? null,
        }];
      });
  }

  return categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.slug,
      title: category.name,
      href: `${ROUTES.shop}/${category.slug}`,
      imageUrl: category.carousel?.find((frame) => frame.imageUrl)?.imageUrl ?? null,
    }));
}

export function shopCategoryIndexCards(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
) {
  if (tiles && tiles.length > 0) {
    const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
    return tiles
      .filter((tile) => tile.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((tile) => {
        const category = categoriesBySlug.get(tile.categorySlug);
        if (!category) return [];
        const lifestyle = getShopLifestyleCategory(category.slug);
        const imageUrl = tile.imageUrl || category.imageUrl || lifestyle?.desktopImage || "";
        const mobileImage = tile.imageUrl || category.imageUrl || lifestyle?.mobileImage || imageUrl;
        return [{
          slug: category.slug,
          kicker: "",
          title: tile.title || category.name,
          href: `${ROUTES.shop}/${category.slug}`,
          desktopImage: imageUrl,
          mobileImage,
          imageAlt: tile.imageAlt || category.name,
        }];
      });
  }

  const published = categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return published.map(toIndexCard);
}
