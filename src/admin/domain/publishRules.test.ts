import { describe, expect, it } from "vitest";

import { shopProductPublishBlockers, tireModelPublishBlockers } from "./publishRules";
import type { ShopProductDraft, TireModelDraft } from "./types";

function model(patch: Partial<TireModelDraft> = {}): TireModelDraft {
  return {
    id: "model-1",
    name: "DSR188",
    slug: "dsr188",
    directionId: "direction-1",
    mainImage: {
      assetId: "media-1",
      alt: "",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    },
    gallery: [],
    advantages: [],
    documents: [],
    sizes: [{ id: "size-1", size: "12.00R20", priceOnRequest: true, available: true }],
    brand: "BIZON",
    descriptionShort: "",
    descriptionLong: "",
    treadType: "",
    selectionAxles: [],
    showInMenu: true,
    menuOrder: 0,
    ...patch,
  };
}

function shopProduct(variants: ShopProductDraft["variants"]): ShopProductDraft {
  return {
    id: "product-1",
    name: "Чехол",
    slug: "case",
    categoryId: "category-1",
    descriptionShort: "",
    descriptionLong: "",
    priceOnRequest: true,
    gallery: [],
    variants,
  };
}

describe("tireModelPublishBlockers editorial placeholder rule", () => {
  it("blocks the explicit placeholder marker on the backend publish boundary", () => {
    expect(tireModelPublishBlockers(model({
      features: [{
        id: "feature-1",
        key: "grip",
        title: "Сцепление",
        description: "Редакционный перевод: RSS, silica improve rubber strength.",
      }],
    }))).toContain("editorialPlaceholder");
  });

  it("allows technical English terms without the placeholder marker", () => {
    expect(tireModelPublishBlockers(model({
      features: [{ id: "feature-1", key: "grip", title: "Сцепление", description: "RSS silica compound." }],
    }))).not.toContain("editorialPlaceholder");
  });
});

describe("shopProductPublishBlockers variant identity", () => {
  it("allows repeated sizes when color or configuration makes the variant distinct", () => {
    expect(shopProductPublishBlockers(shopProduct([
      { id: "red-m", color: "Красный", size: "M", sku: "RED-M", priceOnRequest: true, available: true },
      { id: "blue-m", color: "Синий", size: "M", sku: "BLUE-M", priceOnRequest: true, available: true },
      { id: "red-m-long", color: "Красный", size: "M", sku: "RED-M-LONG", configuration: "Long range", priceOnRequest: true, available: true },
    ]))).not.toContain("duplicateSize");
  });

  it("blocks duplicate normalized color, size, and configuration combinations", () => {
    expect(shopProductPublishBlockers(shopProduct([
      { id: "red-m-1", color: "Красный", size: "M", sku: "RED-M-1", configuration: "Standard", priceOnRequest: true, available: true },
      { id: "red-m-2", color: "красный", size: " m ", sku: "RED-M-2", configuration: "standard", priceOnRequest: true, available: true },
    ]))).toContain("duplicateSize");
  });
});
