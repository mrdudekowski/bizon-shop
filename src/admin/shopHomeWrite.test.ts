import { describe, expect, it } from "vitest";

import type { ShopHomePageDraft } from "./domain/types";
import { shopHomeChildRows, shopHomeParentValues } from "./shopHomeWrite";

const draft: ShopHomePageDraft = {
  id: "shop-home",
  seoTitle: "Shop",
  seoDescription: "Desc",
  hero: {
    eyebrow: "E",
    title: "T",
    lead: "L",
    cta: { label: "Go", href: "#wheels" },
    image: { assetId: "12", alt: "Hero" },
  },
  wheelsIntro: { eyebrow: "", title: "Intro", lead: "Lead", kicker: "K" },
  orderSteps: [{ id: "step-1", title: "One", description: "Do" }],
  categoryCarousel: [
    {
      id: "acc",
      kicker: "Accessories",
      title: "Детали",
      action: "Open",
      href: "/shop/accessories",
      alt: "Acc",
      desktopImage: { assetId: "21", alt: "" },
    },
  ],
  vehicles: {
    eyebrow: "VE",
    title: "VT",
    lead: "VL",
    cta: { label: "Cta", href: "#wheels" },
    slides: [{ id: "v1", title: "Rubicon", alt: "R", image: { assetId: "33", alt: "" } }],
  },
} as ShopHomePageDraft;

describe("shopHomeWrite", () => {
  it("includes wheels intro and vehicles shell in the parent page values", () => {
    const values = shopHomeParentValues(draft);
    expect(values).toContain("Intro");
    expect(values).toContain("K");
    expect(values).toContain("VT");
    expect(values).toContain(12);
  });

  it("replaces child rows instead of updating existing ids only", () => {
    expect(shopHomeChildRows(2, draft)).toEqual({
      steps: [{ id: "step-1", parentId: 2, order: 1, title: "One", description: "Do" }],
      carousel: [
        {
          id: "acc",
          parentId: 2,
          order: 1,
          kicker: "Accessories",
          title: "Детали",
          action: "Open",
          href: "/shop/accessories",
          alt: "Acc",
          desktopImageId: 21,
          mobileImageId: null,
        },
      ],
      vehicles: [{ id: "v1", parentId: 2, order: 1, title: "Rubicon", alt: "R", imageId: 33 }],
    });
  });
});
