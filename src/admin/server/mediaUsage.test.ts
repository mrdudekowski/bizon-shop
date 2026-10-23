import { describe, expect, it } from "vitest";
import { mediaUsageSql, toMediaUsageRecord, type MediaUsageRow } from "./mediaUsage";

describe("structured media usage", () => {
  it("uses public-reader status and rendering rules instead of treating every foreign key as visible", () => {
    expect(mediaUsageSql).toContain("products.status = 'published' AND shop_categories.status = 'published'");
    expect(mediaUsageSql).toContain("pages.status = 'published' AND categories.status = 'published' AND tiles.carousel_visible");
    expect(mediaUsageSql).toContain("('home_selection_entry_image_id', 'selection.image', 'Устаревший блок подбора → изображение', false)");
    expect(mediaUsageSql).toContain("Публичная модель категории выводит только первый слайд карусели.");
    expect(mediaUsageSql).toContain("WHERE rels.media_id = ANY($1::int[]) AND rels.path = 'image'");
    expect(mediaUsageSql).toContain("pages.key::text = ANY($2::text[])");
    expect(mediaUsageSql).toContain("pages.key::text <> ALL($2::text[])");
  });

  it("keeps stable placement identity, hierarchical labels, visibility state and review reason", () => {
    const row: MediaUsageRow = {
      media_id: 41,
      usage_id: "pages:home:home_hero_image_id",
      top_level_key: "site",
      top_level_label: "Сайт",
      page_key: "home",
      page_label: "Главная",
      placement_key: "hero.image",
      placement_label: "Hero → изображение",
      state: "hidden",
      review_recommended: true,
      diagnostic_reason: "Публичный слот изображения не выводится активным рендерером страницы.",
      detachable: true,
    };

    expect(toMediaUsageRecord(row)).toEqual({
      id: row.usage_id,
      mediaId: "41",
      topLevelKey: "site",
      topLevelLabel: "Сайт",
      pageKey: "home",
      pageLabel: "Главная",
      placementKey: "hero.image",
      placementLabel: "Hero → изображение",
      state: "hidden-not-rendered",
      reviewRecommended: true,
      diagnosticReason: row.diagnostic_reason,
      detachable: true,
    });
  });

  it("does not infer broken usage from hidden state alone", () => {
    const row: MediaUsageRow = {
      media_id: 7,
      usage_id: "shop:2:carousel_image_media_id",
      top_level_key: "shop",
      top_level_label: "Bizon Shop",
      page_key: "shop-home",
      page_label: "Главная Bizon Shop",
      placement_key: "catalog.carousel",
      placement_label: "Карусель категорий",
      state: "hidden",
      review_recommended: false,
      diagnostic_reason: null,
      detachable: true,
    };
    expect(toMediaUsageRecord(row).reviewRecommended).toBe(false);
  });
});
