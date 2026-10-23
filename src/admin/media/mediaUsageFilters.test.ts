import { describe, expect, it } from "vitest";
import type { MediaListItem } from "@/admin/domain/types";
import { filterAssetsByUsage, getMediaUsageOptions } from "./mediaUsageFilters";

const assets: MediaListItem[] = [
  {
    id: "shared",
    name: "shared.jpg",
    mimeType: "image/jpeg",
    dataUrl: "/media/shared.jpg",
    usedBy: [],
    usages: [
      {
        id: "shop-outdoor-carousel",
        mediaId: "shared",
        topLevelKey: "shop",
        topLevelLabel: "Bizon Shop",
        pageKey: "outdoor",
        pageLabel: "Кемпинг",
        placementKey: "carousel",
        placementLabel: "Карусель",
        state: "published-visible",
        reviewRecommended: false,
        detachable: true,
      },
      {
        id: "home-hero",
        mediaId: "shared",
        topLevelKey: "home",
        topLevelLabel: "Главная",
        pageKey: "home",
        pageLabel: "Главная",
        placementKey: "hero",
        placementLabel: "Hero",
        state: "published-visible",
        reviewRecommended: false,
        detachable: true,
      },
    ],
  },
  {
    id: "tire-iq",
    name: "article.jpg",
    mimeType: "image/jpeg",
    dataUrl: "/media/article.jpg",
    usedBy: [],
    usages: [
      {
        id: "tire-iq-article-cover",
        mediaId: "tire-iq",
        topLevelKey: "tire-iq",
        topLevelLabel: "Tire IQ",
        pageKey: "article-1",
        pageLabel: "Статья 1",
        placementKey: "cover",
        placementLabel: "Обложка статьи",
        state: "draft-unpublished",
        reviewRecommended: false,
        detachable: true,
      },
    ],
  },
  {
    id: "unused",
    name: "unused.jpg",
    mimeType: "image/jpeg",
    dataUrl: "/media/unused.jpg",
    usedBy: [],
    usages: [],
  },
];

describe("media usage filters", () => {
  it("includes an asset once when any usage matches and keeps all its usages", () => {
    const result = filterAssetsByUsage(assets, { topLevelKey: "shop" });

    expect(result.map((asset) => asset.id)).toEqual(["shared"]);
    expect(result[0]!.usages!.map((usage) => usage.id)).toEqual(["shop-outdoor-carousel", "home-hero"]);
  });

  it("builds page options from the selected top-level page and placements from the selected page", () => {
    const underShop = getMediaUsageOptions(assets, { topLevelKey: "shop" });
    const underOutdoor = getMediaUsageOptions(assets, { topLevelKey: "shop", pageKey: "outdoor" });

    expect(underShop.pages).toEqual([{ key: "outdoor", label: "Кемпинг" }]);
    expect(underShop.placements).toEqual([]);
    expect(underOutdoor.placements).toEqual([{ key: "carousel", label: "Карусель" }]);
  });

  it("shows as unused only assets with no usages of any state", () => {
    const result = filterAssetsByUsage(assets, { state: "unused" });

    expect(result.map((asset) => asset.id)).toEqual(["unused"]);
  });
});
