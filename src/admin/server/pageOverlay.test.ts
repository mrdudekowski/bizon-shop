import { describe, expect, it } from "vitest";

import { mergeLegacyPageOverlay } from "./pageOverlay";

describe("mergeLegacyPageOverlay", () => {
  it("drops the retired selection entry from legacy Home overlays", () => {
    const result = mergeLegacyPageOverlay(
      { id: "home", hero: { title: "Главная" }, resume: { title: "Три ответа" } },
      { selectionEntry: { title: "Старый подбор" }, resume: { title: "Продолжить подбор" } },
    );

    expect("selectionEntry" in result).toBe(false);
    expect("resume" in result).toBe(false);
  });

  it("treats a current stub-page draft's omitted editorial fields as cleared", () => {
    const result = mergeLegacyPageOverlay(
      { id: "warranty", sections: [{ id: "old", heading: "Old", body: "Old body" }], features: [{ id: "f", title: "Old", text: "Old" }] },
      { id: "warranty", documents: [], hero: { title: "Warranty" } },
    );

    expect(result).not.toHaveProperty("sections");
    expect(result).not.toHaveProperty("features");
  });

  it("keeps editorial fields from published data when merging a legacy stub overlay", () => {
    const result = mergeLegacyPageOverlay(
      { id: "warranty", sections: [{ id: "old", heading: "Published", body: "Keep it" }] },
      { id: "warranty", hero: { title: "Warranty" } },
    );

    expect(result).toMatchObject({ sections: [{ id: "old", heading: "Published", body: "Keep it" }] });
  });

  it("keeps migrated Shop tile captions and icons when an older page draft omits them", () => {
    const result = mergeLegacyPageOverlay(
      {
        id: "shop-home",
        homeCarousel: { diskCaption: "Кованые диски" },
        catalog: {
          copy: { title: "Каталог" },
          tiles: [{ categoryId: "8", title: "Кемпинг", visible: true, homeCarouselCaption: "Для маршрута", icon: { assetId: "current-icon" } }],
        },
      },
      {
        id: "shop-home",
        catalog: {
          copy: { title: "Обновлённый каталог" },
          tiles: [{ categoryId: "8", title: "Путешествия", visible: true }],
        },
      },
    );

    expect(result).toMatchObject({
      homeCarousel: { diskCaption: "Кованые диски" },
      catalog: {
        copy: { title: "Обновлённый каталог" },
        tiles: [{
          categoryId: "8",
          title: "Путешествия",
          homeCarouselCaption: "Для маршрута",
          icon: { assetId: "current-icon" },
        }],
      },
    });
  });

  it("keeps migrated Shop tiles when an older page draft has an empty catalog list", () => {
    const result = mergeLegacyPageOverlay(
      { id: "shop-home", catalog: { copy: { title: "Catalog" }, tiles: [{ categoryId: "8", homeCarouselCaption: "Для маршрута" }] } },
      { id: "shop-home", catalog: { copy: { title: "Legacy draft" }, tiles: [] } },
    );

    expect(result).toMatchObject({
      catalog: {
        copy: { title: "Legacy draft" },
        tiles: [{ categoryId: "8", homeCarouselCaption: "Для маршрута" }],
      },
    });
  });
});
