import { ROUTES } from "@/constants/navigation";
import type { CmsShopCategory } from "./types";
import type { ShopCatalogTile } from "./pages/types";

export type ShopCategoryPageView = "catalog" | "lifestyle" | "not-found";

const SHOP_CATEGORY_ICON_FILES: Readonly<Record<string, string>> = {
  outdoor: "camping-travel",
  accessory: "accessories-shirt",
  accessories: "car-comfort",
  "car-comfort": "car-comfort",
  "masla-i-zapchasti": "oils-spare-parts",
  pritsepy: "trailers",
  trailers: "trailers",
};

function shopCategoryStaticIconUrl(slug: string, tone: "black" | "white"): string | null {
  const file = SHOP_CATEGORY_ICON_FILES[slug];
  return file ? `/images/shop/category-icons/${file}-${tone}.png` : null;
}

/** Dark icons for light surfaces (e.g. category index). */
export function shopCategoryIconUrl(slug: string): string | null {
  return shopCategoryStaticIconUrl(slug, "black");
}

/** White icons for the Shop home carousel overlay on dark photography. */
export function shopCategoryCarouselIconUrl(slug: string): string | null {
  return shopCategoryStaticIconUrl(slug, "white");
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

export type ShopHomeCategoryCard = {
  slug: string;
  title: string;
  href: string;
  iconUrl: string | null;
};

function categoryTileRows(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
): { category: CmsShopCategory; tile: ShopCatalogTile | null }[] {
  const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
  const configured = (tiles ?? []).flatMap((tile) => {
    const category = categoriesBySlug.get(tile.categorySlug);
    return category ? [{ category, tile }] : [];
  });
  const configuredSlugs = new Set((tiles ?? []).map((tile) => tile.categorySlug));
  const derived = categories
    .filter((category) => category.showInMenu && !configuredSlugs.has(category.slug))
    .map((category) => ({ category, tile: null }));

  return [...configured, ...derived].sort((a, b) =>
    (a.tile?.sortOrder ?? a.category.sortOrder) - (b.tile?.sortOrder ?? b.category.sortOrder),
  );
}

export function shopHomeCategoryCards(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
): ShopHomeCategoryCard[] {
  return categoryTileRows(categories, tiles)
    .filter(({ category, tile }) => tile?.visible ?? category.showInMenu)
    .map(({ category, tile }) => ({
      slug: category.slug,
      title: tile?.title || category.name,
      href: `${ROUTES.shop}/${category.slug}`,
      iconUrl: shopCategoryCarouselIconUrl(category.slug),
    }));
}

export type ShopHomeCarouselSlide = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
};

function shopCategoryCarouselImage(
  category: CmsShopCategory,
  tileImageUrl?: string,
  tileCarouselImageUrl?: string,
): string | null {
  return (
    tileCarouselImageUrl ||
    category.carousel?.find((frame) => frame.imageUrl)?.imageUrl ||
    tileImageUrl ||
    category.imageUrl ||
    null
  );
}

export function shopHomeCarouselSlides(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
): ShopHomeCarouselSlide[] {
  return categoryTileRows(categories, tiles)
    .filter(({ category, tile }) =>
      (tile?.visible ?? category.showInMenu) &&
      (tile?.carouselVisible ?? (tiles && tiles.length > 0 ? (category.carousel?.length ?? 0) > 0 : category.showInMenu)),
    )
    .map(({ category, tile }) => {
      const imageUrl = shopCategoryCarouselImage(category, tile?.imageUrl, tile?.carouselImageUrl);
      return {
        id: category.slug,
        title: tile?.title || category.name,
        href: `${ROUTES.shop}/${category.slug}`,
        imageUrl,
      };
    });
}

export function shopCategoryIndexCards(
  categories: readonly CmsShopCategory[],
  tiles?: readonly ShopCatalogTile[],
) {
  return categoryTileRows(categories, tiles)
    .filter(({ category, tile }) => tile?.visible ?? category.showInMenu)
    .map(({ category, tile }) => {
      const imageUrl = tile?.imageUrl || category.imageUrl || "";
      const mobileImage = imageUrl;
      const imageAlt = tile?.imageAlt || category.name;
      return {
        slug: category.slug,
        kicker: "",
        title: tile?.title || category.name,
        href: `${ROUTES.shop}/${category.slug}`,
        desktopImage: imageUrl,
        mobileImage,
        imageAlt,
      };
    });
}
