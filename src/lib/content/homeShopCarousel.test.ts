import { describe, expect, it } from "vitest";
import { SHOP_HOME_PAGE_DEFAULTS } from "./pages/defaults/shopHome";
import type { ShopHomePageContent } from "./pages/types";
import { buildHomeShopCarouselItems } from "./homeShopCarousel";

function shopHome(tiles: ShopHomePageContent["catalog"]["tiles"]): ShopHomePageContent {
  return {
    ...SHOP_HOME_PAGE_DEFAULTS,
    homeCarousel: { diskCaption: "Диски под ваш автомобиль" },
    catalog: { ...SHOP_HOME_PAGE_DEFAULTS.catalog, tiles },
  };
}

describe("buildHomeShopCarouselItems", () => {
  it("puts the fixed disk item first and follows visible categories by CMS sort order", () => {
    expect(buildHomeShopCarouselItems(shopHome([
      { categoryId: "2", categorySlug: "outdoor", title: "Кемпинг", visible: true, sortOrder: 8, carouselVisible: true, homeCarouselCaption: "Для маршрута", iconUrl: "/outdoor.svg" },
      { categoryId: "1", categorySlug: "accessories", title: "Аксессуары", visible: true, sortOrder: 2, carouselVisible: true, homeCarouselCaption: "Ваш стиль", iconUrl: "/accessories.svg" },
    ]))).toEqual([
      { id: "wheels", title: "Диски", caption: "Диски под ваш автомобиль", iconUrl: "/images/shop/category-icons/tire.svg", iconAlt: "Диск" },
      { id: "category-1", title: "Аксессуары", caption: "Ваш стиль", iconUrl: "/accessories.svg", iconAlt: "Аксессуары" },
      { id: "category-2", title: "Кемпинг", caption: "Для маршрута", iconUrl: "/outdoor.svg", iconAlt: "Кемпинг" },
    ]);
  });

  it("omits categories hidden on the site or missing a caption or icon", () => {
    expect(buildHomeShopCarouselItems(shopHome([
      { categoryId: "hidden", categorySlug: "hidden", title: "Скрытая", visible: false, sortOrder: 0, carouselVisible: true, homeCarouselCaption: "Скрытый текст", iconUrl: "/hidden.svg" },
      { categoryId: "caption", categorySlug: "caption", title: "Без подписи", visible: true, sortOrder: 1, carouselVisible: true, homeCarouselCaption: "   ", iconUrl: "/caption.svg" },
      { categoryId: "icon", categorySlug: "icon", title: "Без иконки", visible: true, sortOrder: 2, carouselVisible: true, homeCarouselCaption: "Текст", iconUrl: "" },
    ]))).toHaveLength(1);
  });

  it("omits categories disabled in the homepage carousel", () => {
    const items = buildHomeShopCarouselItems(shopHome([
      { categoryId: "off", categorySlug: "off", title: "Скрытая из карусели", visible: true, sortOrder: 1, carouselVisible: false, homeCarouselCaption: "Не показывать", iconUrl: "/off.svg" },
      { categoryId: "on", categorySlug: "on", title: "В карусели", visible: true, sortOrder: 2, carouselVisible: true, homeCarouselCaption: "Показывать", iconUrl: "/on.svg" },
    ]));

    expect(items.map((item) => item.id)).toEqual(["wheels", "category-on"]);
  });

  it("uses the catalog category icon when a visible carousel tile has no CMS icon", () => {
    const items = buildHomeShopCarouselItems(shopHome([
      { categoryId: "accessory", categorySlug: "accessory", title: "Аксессуары", visible: true, sortOrder: 1, carouselVisible: true, homeCarouselCaption: "Аксессуары для вашего стиля", iconUrl: null },
    ]));

    expect(items).toContainEqual({
      id: "category-accessory",
      title: "Аксессуары",
      caption: "Аксессуары для вашего стиля",
      iconUrl: "/images/shop/category-icons/tshirt-black.svg",
      iconAlt: "Аксессуары",
    });
  });

  it("uses the latest published icon and caption from the Shop tile", () => {
    const items = buildHomeShopCarouselItems(shopHome([
      { categoryId: "3", categorySlug: "outdoor", title: "Кемпинг", visible: true, sortOrder: 1, carouselVisible: true, homeCarouselCaption: "Обновлено", iconUrl: "/new.svg", iconFocalX: 0.25, iconFocalY: 0.7, iconFocalByViewport: { mobile: { x: 0.8, y: 0.2 } } },
    ]));
    expect(items[1]).toMatchObject({ caption: "Обновлено", iconUrl: "/new.svg", iconFocalX: 0.25, iconFocalY: 0.7, iconFocalByViewport: { mobile: { x: 0.8, y: 0.2 } } });
  });
});
