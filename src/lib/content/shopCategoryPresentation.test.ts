import { describe, expect, it } from "vitest";

import {
  shopCategoryIndexCards,
  shopCategoryLabel,
  shopCategoryNavLinks,
} from "./shopCategoryPresentation";
import type { CmsShopCategory } from "./types";

const categories: CmsShopCategory[] = [
  {
    slug: "outdoor",
    name: "Кемпинг и путешествия",
    description: "",
    imageUrl: "/cms/outdoor.png",
    showInMenu: true,
    sortOrder: 0,
  },
  {
    slug: "accessories",
    name: "Комфорт в автомобиле",
    description: "",
    imageUrl: "/cms/acc.png",
    showInMenu: true,
    sortOrder: 1,
  },
  {
    slug: "pritsepy",
    name: "Прицепы",
    description: "",
    imageUrl: "/cms/trailer.png",
    showInMenu: true,
    sortOrder: 3,
  },
  {
    slug: "hidden",
    name: "Скрытая",
    description: "",
    showInMenu: false,
    sortOrder: 9,
  },
];

describe("shopCategoryPresentation", () => {
  it("keeps visible lifestyle labels for matching slugs and CMS names for the rest", () => {
    expect(shopCategoryLabel(categories[1]!)).toBe("Accessories");
    expect(shopCategoryLabel(categories[2]!)).toBe("Прицепы");
  });

  it("builds chrome links from published menu categories, lifestyle first labels, all-categories last", () => {
    expect(shopCategoryNavLinks(categories)).toEqual([
      { href: "/shop/outdoor", label: "Outdoor" },
      { href: "/shop/accessories", label: "Accessories" },
      { href: "/shop/pritsepy", label: "Прицепы" },
      { href: "/shop/categories", label: "Все категории" },
    ]);
  });

  it("uses lifestyle card chrome for accessories/outdoor and CMS fields for other categories", () => {
    const cards = shopCategoryIndexCards(categories);
    expect(cards.map((card) => card.slug)).toEqual(["outdoor", "accessories", "pritsepy"]);
    expect(cards[0]).toMatchObject({
      kicker: "Outdoor",
      title: "За пределами маршрута",
      desktopImage: expect.stringContaining("outdoor-wrangler"),
    });
    expect(cards[2]).toEqual({
      slug: "pritsepy",
      kicker: "Прицепы",
      title: "Прицепы",
      href: "/shop/pritsepy",
      desktopImage: "/cms/trailer.png",
      mobileImage: "/cms/trailer.png",
      imageAlt: "Прицепы",
    });
  });
});
