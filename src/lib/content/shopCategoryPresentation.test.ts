import { describe, expect, it } from "vitest";

import {
  shopCategoryIndexCards,
  shopCategoryLabel,
  shopCategoryNavLinks,
  shopHomeCarouselSlides,
  shopHomeCategoryCards,
  shopProductCountLabel,
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
  it("uses the published CMS name for every category", () => {
    expect(shopCategoryLabel(categories[1]!)).toBe("Комфорт в автомобиле");
    expect(shopCategoryLabel(categories[2]!)).toBe("Прицепы");
  });

  it("declines товар for Russian counts", () => {
    expect(shopProductCountLabel(1)).toBe("1 товар");
    expect(shopProductCountLabel(2)).toBe("2 товара");
    expect(shopProductCountLabel(5)).toBe("5 товаров");
    expect(shopProductCountLabel(21)).toBe("21 товар");
    expect(shopProductCountLabel(12)).toBe("12 товаров");
  });

  it("builds chrome links from published menu categories and CMS names", () => {
    expect(shopCategoryNavLinks(categories)).toEqual([
      { href: "/shop/outdoor", label: "Кемпинг и путешествия" },
      { href: "/shop/accessories", label: "Комфорт в автомобиле" },
      { href: "/shop/pritsepy", label: "Прицепы" },
      { href: "/shop/categories", label: "Все категории" },
    ]);
  });

  it("builds index cards from CMS names and images, with lifestyle photos only as fallback", () => {
    const cards = shopCategoryIndexCards(categories);
    expect(cards.map((card) => card.slug)).toEqual(["outdoor", "accessories", "pritsepy"]);
    expect(cards[0]).toEqual({
      slug: "outdoor",
      kicker: "",
      title: "Кемпинг и путешествия",
      href: "/shop/outdoor",
      desktopImage: "/cms/outdoor.png",
      mobileImage: "/cms/outdoor.png",
      imageAlt: "Кемпинг и путешествия",
    });
    expect(cards[2]).toEqual({
      slug: "pritsepy",
      kicker: "",
      title: "Прицепы",
      href: "/shop/pritsepy",
      desktopImage: "/cms/trailer.png",
      mobileImage: "/cms/trailer.png",
      imageAlt: "Прицепы",
    });
  });

  it("rotates up to four carousel frames per category and keeps a title slide when photos are missing", () => {
    const slides = shopHomeCarouselSlides([
      {
        ...categories[0]!,
        carousel: [
          { title: "Стоянка у воды", imageUrl: "/camp-1.jpg" },
          { title: "", imageUrl: "/camp-2.jpg" },
          { title: "Без фото", imageUrl: null },
        ],
      },
      categories[1]!,
    ]);
    expect(slides.map((slide) => slide.title)).toEqual([
      "Стоянка у воды",
      "Кемпинг и путешествия",
      "Комфорт в автомобиле",
    ]);
    expect(slides[1]?.imageUrl).toBe("/camp-2.jpg");
    expect(slides[2]?.imageUrl).toBeNull();
  });

  it("builds category cards from the menu icon", () => {
    expect(
      shopHomeCategoryCards(categories).map((card) => ({
        slug: card.slug,
        href: card.href,
        iconUrl: card.iconUrl,
      })),
    ).toEqual([
      { slug: "outdoor", href: "/shop/outdoor", iconUrl: "/cms/outdoor.png" },
      { slug: "accessories", href: "/shop/accessories", iconUrl: "/cms/acc.png" },
      { slug: "pritsepy", href: "/shop/pritsepy", iconUrl: "/cms/trailer.png" },
    ]);
  });

  it("falls back to lifestyle images when a published category has no photo", () => {
    const cards = shopCategoryIndexCards([
      {
        slug: "accessories",
        name: "Комфорт в автомобиле",
        description: "",
        showInMenu: true,
        sortOrder: 0,
      },
    ]);
    expect(cards[0]).toMatchObject({
      title: "Комфорт в автомобиле",
      desktopImage: expect.stringContaining("accessories-driver-glasses"),
      mobileImage: expect.stringContaining("accessories-driver-glasses-primorye-mobile"),
    });
  });
});
