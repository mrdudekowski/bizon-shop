import { ROUTES } from "@/constants/navigation";
import { getShopLifestyleCategory, SHOP_LIFESTYLE_CATEGORIES } from "@/constants/shopCategories";
import type { CmsShopCategory } from "./types";

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

export function shopHomeCategoryCards(categories: readonly CmsShopCategory[]): ShopHomeCategoryCard[] {
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

export function shopHomeCarouselSlides(categories: readonly CmsShopCategory[]): ShopHomeCarouselSlide[] {
  return categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((category) => {
      const href = `${ROUTES.shop}/${category.slug}`;
      const frames = (category.carousel ?? [])
        .filter((frame) => frame.imageUrl)
        .slice(0, 4)
        .map((frame, index) => ({
          id: `${category.slug}-${index}`,
          title: frame.title.trim() || category.name,
          href,
          imageUrl: frame.imageUrl ?? null,
        }));
      if (frames.length > 0) return frames;
      return [{ id: category.slug, title: category.name, href, imageUrl: null }];
    });
}

export function shopCategoryIndexCards(categories: readonly CmsShopCategory[]) {
  const published = categories
    .filter((category) => category.showInMenu)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (published.length > 0) {
    return published.map(toIndexCard);
  }

  return SHOP_LIFESTYLE_CATEGORIES.map((category) =>
    toIndexCard({
      slug: category.slug,
      name: category.title,
      imageUrl: category.desktopImage,
    }),
  );
}
