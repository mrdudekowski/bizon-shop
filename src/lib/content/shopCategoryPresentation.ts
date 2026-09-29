import { ROUTES } from "@/constants/navigation";
import { getShopLifestyleCategory, SHOP_LIFESTYLE_CATEGORIES } from "@/constants/shopCategories";
import type { CmsShopCategory } from "./types";

export function shopCategoryLabel(category: Pick<CmsShopCategory, "slug" | "name">): string {
  return category.name;
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
