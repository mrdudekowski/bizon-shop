import { describe, expect, it } from "vitest";
import { shopProductPublishBlockers, tireModelPublishBlockers } from "./publishRules";
import type { ShopProductDraft, TireModelDraft } from "./types";

function model(patch: Partial<TireModelDraft> = {}): TireModelDraft {
  return {
    id: "m1",
    name: "LH01",
    slug: "lh01",
    directionId: "d1",
    mainImage: {
      assetId: "a1",
      alt: "",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    },
    sizes: [{ id: "s1", size: "315/80R22.5", priceOnRequest: true, available: true }],
    brand: "",
    descriptionShort: "",
    descriptionLong: "",
    treadType: "",
    selectionAxles: [],
    gallery: [],
    advantages: [],
    documents: [],
    showInMenu: false,
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

describe("tireModelPublishBlockers", () => {
  it("allows a card the site can render", () => {
    expect(tireModelPublishBlockers(model())).toEqual([]);
  });

  it("blocks a missing name, slug, direction, image, size, and price choice", () => {
    expect(
      tireModelPublishBlockers(
        model({
          name: " ",
          slug: "",
          directionId: "",
          mainImage: undefined,
          sizes: [{ id: "s1", size: " ", priceOnRequest: false, available: true }],
        }),
      ),
    ).toEqual(["name", "slug", "direction", "mainImage", "size", "price"]);
  });

  it("does not block a missing sku", () => {
    expect(tireModelPublishBlockers(model())).not.toContain("sku");
  });

  it("blocks a duplicate size inside the model", () => {
    expect(
      tireModelPublishBlockers(
        model({
          sizes: [
            { id: "s1", size: "315/80R22.5", priceOnRequest: true, available: true },
            { id: "s2", size: "315/80R22.5", priceOnRequest: true, available: true },
          ],
        }),
      ),
    ).toContain("duplicateSize");
  });

  it("blocks a duplicate SKU across sizes inside the model", () => {
    expect(
      tireModelPublishBlockers(
        model({
          sizes: [
            { id: "s1", size: "315/80R22.5", sku: "DSR-01", priceOnRequest: true, available: true },
            { id: "s2", size: "385/65R22.5", sku: "dsr-01 ", priceOnRequest: true, available: true },
          ],
        }),
      ),
    ).toContain("duplicateSku");
  });

  it("blocks publication of an explicitly marked editorial placeholder", () => {
    expect(tireModelPublishBlockers(model({
      features: [{
        id: "feature-1",
        key: "grip",
        title: "Сцепление",
        description: "Редакционный перевод: RSS, silica improve rubber strength.",
      }],
    }))).toContain("editorialPlaceholder");
  });

  it("allows foreign technical terms when no editorial placeholder marker is present", () => {
    expect(tireModelPublishBlockers(model({
      features: [{ id: "feature-1", key: "grip", title: "Сцепление", description: "RSS silica compound." }],
    }))).not.toContain("editorialPlaceholder");
  });
});

describe("shopProductPublishBlockers variant identity", () => {
  it("allows the same size in different colors or configurations", () => {
    expect(shopProductPublishBlockers(shopProduct([
      { id: "red-m", color: "Красный", size: "M", sku: "RED-M", priceOnRequest: true, available: true },
      { id: "blue-m", color: "Синий", size: "M", sku: "BLUE-M", priceOnRequest: true, available: true },
      { id: "red-m-long", color: "Красный", size: "M", sku: "RED-M-LONG", configuration: "Long range", priceOnRequest: true, available: true },
    ]))).not.toContain("duplicateSize");
  });

  it("blocks a repeated full color, size, and configuration combination", () => {
    expect(shopProductPublishBlockers(shopProduct([
      { id: "red-m-1", color: "Красный", size: "M", sku: "RED-M-1", configuration: "Standard", priceOnRequest: true, available: true },
      { id: "red-m-2", color: "красный", size: " m ", sku: "RED-M-2", configuration: "standard", priceOnRequest: true, available: true },
    ]))).toContain("duplicateSize");
  });
});
