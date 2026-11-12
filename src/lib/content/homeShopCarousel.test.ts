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
      { categoryId: "2", categorySlug: "outdoor", title: "Кемпинг", visible: true, sortOrder: 8, carouselVisible: false, homeCarouselCaption: "Для маршрута", iconUrl: "/outdoor.svg" },
      { categoryId: "1", categorySlug: "accessories", title: "Аксессуары", visible: true, sortOrder: 2, carouselVisible: false, homeCarouselCaption: "Ваш стиль", iconUrl: "/accessories.svg" },
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

  it("uses the latest published icon and caption from the Shop tile", () => {
    const items = buildHomeShopCarouselItems(shopHome([
      { categoryId: "3", categorySlug: "outdoor", title: "Кемпинг", visible: true, sortOrder: 1, carouselVisible: true, homeCarouselCaption: "Обновлено", iconUrl: "/new.svg" },
    ]));
    expect(items[1]).toMatchObject({ caption: "Обновлено", iconUrl: "/new.svg" });
  });
});
