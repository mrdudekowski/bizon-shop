import { describe, expect, it } from "vitest";
import { tireModelPublishBlockers } from "./publishRules";
import type { TireModelDraft } from "./types";

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
    selectionVehicleTypes: [],
    selectionConditions: [],
    selectionAxles: [],
    gallery: [],
    advantages: [],
    documents: [],
    showInMenu: false,
    menuOrder: 0,
    ...patch,
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
});
