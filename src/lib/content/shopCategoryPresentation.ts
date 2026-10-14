import { ROUTES } from "@/constants/navigation";
import { getShopLifestyleCategory } from "@/constants/shopCategories";
import type { CmsShopCategory } from "./types";
import type { ShopCatalogTile } from "./pages/types";

export type ShopCategoryPageView = "catalog" | "lifestyle" | "not-found";

const SHOP_CATEGORY_BLACK_ICONS: Readonly<Record<string, string>> = {
  outdoor: "/images/shop/category-icons/camping-travel-black.png",
  accessory: "/images/shop/category-icons/accessories-shirt-black.png",
  accessories: "/images/shop/category-icons/car-comfort-black.png",
  "car-comfort": "/images/shop/category-icons/car-comfort-black.png",
  "masla-i-zapchasti": "/images/shop/category-icons/oils-spare-parts-black.png",
  pritsepy: "/images/shop/category-icons/trailers-black.png",
  trailers: "/images/shop/category-icons/trailers-black.png",
};

export function shopCategoryIconUrl(slug: string): string | null {
  return SHOP_CATEGORY_BLACK_ICONS[slug] ?? null;
}

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
          iconUrl: tile.iconUrl || null,
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
      iconUrl: null,
    }));
}

export type ShopHomeCarouselSlide = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
};

const SHOP_CATEGORY_CAROUSEL_PHOTOS: Readonly<Record<string, string>> = {
  accessories: "/images/premium/shop/lifestyle/categories/car-comfort-photo.jpg",
  "masla-i-zapchasti": "/images/premium/shop/lifestyle/categories/oils-spare-parts-photo.jpg",
};

function shopCategoryCarouselImage(
  category: CmsShopCategory,
  tileImageUrl?: string,
  tileCarouselImageUrl?: string,
): string | null {
  const lifestyleSlug = category.slug === "accessory" ? "accessories" : category.slug;
  return (
    tileCarouselImageUrl ||
    category.carousel?.find((frame) => frame.imageUrl)?.imageUrl ||
    SHOP_CATEGORY_CAROUSEL_PHOTOS[category.slug] ||
    tileImageUrl ||
    category.imageUrl ||
    getShopLifestyleCategory(lifestyleSlug)?.desktopImage ||
    null
  );
}

export function shopHomeCarouselSlides(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
): ShopHomeCarouselSlide[] {
  if (tiles && tiles.length > 0) {
    const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
    return tiles
      .filter((tile) => tile.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((tile) => {
        const category = categoriesBySlug.get(tile.categorySlug);
        if (!category) return [];
        const imageUrl = shopCategoryCarouselImage(category, tile.imageUrl, tile.carouselImageUrl);
        return [{
          id: category.slug,
          title: tile.title || category.name,
          href: `${ROUTES.shop}/${category.slug}`,
          imageUrl,
        }];
      });
  }

  return categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const imageUrl = shopCategoryCarouselImage(category);
      return {
        id: category.slug,
        title: category.name,
        href: `${ROUTES.shop}/${category.slug}`,
        imageUrl,
      };
    });
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
