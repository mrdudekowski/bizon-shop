import { describe, expect, it } from "vitest";

import {
  shopCategoryIndexCards,
  shopCategoryLabel,
  shopCategoryPageView,
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
  it("uses the CMS product catalog when a lifestyle slug is a published category", () => {
    expect(shopCategoryPageView(true, true)).toBe("catalog");
  });

  it("uses the lifestyle fallback only when no CMS category is published", () => {
    expect(shopCategoryPageView(false, true)).toBe("lifestyle");
    expect(shopCategoryPageView(false, false)).toBe("not-found");
  });

  it("uses the published CMS name for every category", () => {
    expect(shopCategoryLabel(categories[1]!)).toBe("Комфорт в автомобиле");
    expect(shopCategoryLabel(categories[2]!)).toBe("Прицепы");
  });

  it("declines товар for Russian counts", () => {
    const cases: [number, string][] = [
      [0, "0 товаров"],
      [1, "1 товар"],
      [2, "2 товара"],
      [4, "4 товара"],
      [5, "5 товаров"],
      [11, "11 товаров"],
      [12, "12 товаров"],
      [14, "14 товаров"],
      [21, "21 товар"],
      [22, "22 товара"],
      [25, "25 товаров"],
      [101, "101 товар"],
      [111, "111 товаров"],
    ];
    for (const [count, expected] of cases) expect(shopProductCountLabel(count)).toBe(expected);
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

  it("does not show hard-coded categories when the published CMS list is empty", () => {
    expect(shopCategoryIndexCards([])).toEqual([]);
  });

  it("uses CMS carousel images and then CMS category covers, without code-owned photos", () => {
    const slides = shopHomeCarouselSlides([
      {
        ...categories[0]!,
        carousel: [
          { title: "Стоянка у воды", imageUrl: "/camp-1.jpg" },
          { title: "Лишний кадр", imageUrl: "/camp-2.jpg" },
        ],
      },
      categories[1]!,
      {
        slug: "accessory",
        name: "Аксессуары",
        description: "",
        showInMenu: true,
        sortOrder: 2,
      },
    ]);
    expect(slides.map((slide) => ({ id: slide.id, title: slide.title, imageUrl: slide.imageUrl }))).toEqual([
      { id: "outdoor", title: "Кемпинг и путешествия", imageUrl: "/camp-1.jpg" },
      {
        id: "accessories",
        title: "Комфорт в автомобиле",
        imageUrl: "/cms/acc.png",
      },
      { id: "accessory", title: "Аксессуары", imageUrl: null },
    ]);
  });

  it("builds category cards with white carousel icons from static assets", () => {
    expect(
      shopHomeCategoryCards(categories).map((card) => ({
        slug: card.slug,
        href: card.href,
        iconUrl: card.iconUrl,
      })),
    ).toEqual([
      { slug: "outdoor", href: "/shop/outdoor", iconUrl: "/images/shop/category-icons/camping-travel-white.png" },
      { slug: "accessories", href: "/shop/accessories", iconUrl: "/images/shop/category-icons/car-comfort-white.png" },
      { slug: "pritsepy", href: "/shop/pritsepy", iconUrl: "/images/shop/category-icons/trailers-white.png" },
    ]);
  });

  it("keeps Shop tile overrides and derives categories missing from the saved tile list", () => {
    const tiles = [
      { categoryId: "1", categorySlug: "pritsepy", title: "Прицепы BIZON", visible: true, sortOrder: 0, iconUrl: "/page/icon.svg", imageUrl: "/page/trailer.jpg", carouselVisible: true, carouselImageUrl: "/page/trailer-slide.jpg" },
      { categoryId: "2", categorySlug: "hidden", title: "Скрыто", visible: true, sortOrder: 1, imageUrl: "/page/hidden.jpg", carouselVisible: true },
      { categoryId: "3", categorySlug: "outdoor", title: "Скрытая плитка", visible: false, sortOrder: 2, carouselVisible: false },
    ];

    expect(shopHomeCategoryCards(categories, tiles)).toEqual([
      { slug: "pritsepy", title: "Прицепы BIZON", href: "/shop/pritsepy", iconUrl: "/images/shop/category-icons/trailers-white.png" },
      { slug: "hidden", title: "Скрыто", href: "/shop/hidden", iconUrl: null },
      { slug: "accessories", title: "Комфорт в автомобиле", href: "/shop/accessories", iconUrl: "/images/shop/category-icons/car-comfort-white.png" },
    ]);
    expect(shopHomeCarouselSlides(categories, tiles)).toEqual([
      { id: "pritsepy", title: "Прицепы BIZON", href: "/shop/pritsepy", imageUrl: "/page/trailer-slide.jpg" },
      { id: "hidden", title: "Скрыто", href: "/shop/hidden", imageUrl: "/page/hidden.jpg" },
    ]);
  });

  it("adds menu categories with no saved tile to the category cards", () => {
    const cards = shopHomeCategoryCards(categories, [
      { categoryId: "1", categorySlug: "pritsepy", title: "Прицепы BIZON", visible: true, sortOrder: 0, carouselVisible: true },
    ]);

    expect(cards.map((card) => ({ slug: card.slug, title: card.title }))).toEqual([
      { slug: "pritsepy", title: "Прицепы BIZON" },
      { slug: "outdoor", title: "Кемпинг и путешествия" },
      { slug: "accessories", title: "Комфорт в автомобиле" },
    ]);
  });

  it("uses carouselVisible independently from catalog tile visibility", () => {
    const slides = shopHomeCarouselSlides(categories, [
      { categoryId: "1", categorySlug: "pritsepy", title: "Прицепы", visible: true, sortOrder: 0, carouselVisible: false },
    ]);

    expect(slides.map((slide) => slide.id)).not.toContain("pritsepy");
  });

  it("builds the catalog index from visible Shop tiles in configured order", () => {
    const cards = shopCategoryIndexCards(categories, [
      { categoryId: "1", categorySlug: "pritsepy", title: "Тяговые решения", visible: true, sortOrder: 0, carouselVisible: false, imageUrl: "/page/trailers.jpg" },
      { categoryId: "2", categorySlug: "missing", title: "Несуществующая категория", visible: true, sortOrder: 1, carouselVisible: false },
      { categoryId: "3", categorySlug: "outdoor", title: "Походы", visible: true, sortOrder: 2, carouselVisible: false, imageUrl: "/page/outdoor.jpg" },
      { categoryId: "4", categorySlug: "accessories", title: "Скрыто", visible: false, sortOrder: 3, carouselVisible: false },
    ]);
    expect(cards.map((card) => ({ title: card.title, href: card.href, desktopImage: card.desktopImage }))).toEqual([
      { title: "Тяговые решения", href: "/shop/pritsepy", desktopImage: "/page/trailers.jpg" },
      { title: "Походы", href: "/shop/outdoor", desktopImage: "/page/outdoor.jpg" },
    ]);
  });

  it("does not substitute code-owned photos when CMS category images are empty", () => {
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
      desktopImage: "",
      mobileImage: "",
    });
  });
});
