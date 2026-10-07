import { describe, expect, it } from "vitest";

import { diffDraft, flattenDraftPaths } from "./draftDiff";
import { isCataloguedField, locateField } from "./changeFieldCatalog";
import type { StatusEntity, TireModelDraft } from "./types";

const placement = {
  assetId: "asset-1",
  alt: "шина",
  focalX: 0.5,
  focalY: 0.5,
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

function tireModel(overrides: Partial<TireModelDraft> = {}): TireModelDraft {
  return {
    id: "model-1",
    name: "LH01",
    slug: "lh01",
    directionId: "dir-long-haul",
    gallery: [],
    advantages: [],
    documents: [],
    sizes: [{ id: "size-1", size: "315/80R22.5", price: 48000, priceOnRequest: false, available: true }],
    brand: "BIZON",
    descriptionShort: "",
    descriptionLong: "",
    treadType: "",
    selectionVehicleTypes: [],
    selectionConditions: [],
    selectionAxles: [],
    showInMenu: false,
    menuOrder: 0,
    mainImage: placement,
    ...overrides,
  };
}

describe("locateField", () => {
  it("names a tire model title as the card name field", () => {
    const location = locateField("tire-model", "name", tireModel());
    expect(location).toMatchObject({
      section: "Шины",
      document: "LH01",
      tab: "Карточка",
      field: "Название",
    });
  });

  it("names a size price with the size label", () => {
    const location = locateField("tire-model", "sizes[0].price", tireModel());
    expect(location).toMatchObject({
      tab: "Размеры",
      field: "Цена",
      itemLabel: "315/80R22.5",
    });
  });
});

describe("diffDraft", () => {
  it("records a text change with a human location", () => {
    const changes = diffDraft(tireModel(), tireModel({ name: "LH01 next" }), "tire-model");
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe("name");
    expect(changes[0].before).toEqual({ kind: "text", value: "LH01" });
    expect(changes[0].after).toEqual({ kind: "text", value: "LH01 next" });
    expect(changes[0].location.field).toBe("Название");
  });

  it("treats a missing previous draft as empty values", () => {
    const changes = diffDraft(null, tireModel({ name: "New" }), "tire-model");
    const name = changes.find((change) => change.path === "name");
    expect(name?.before).toEqual({ kind: "empty" });
    expect(name?.after).toEqual({ kind: "text", value: "New" });
  });

  it("compares images by asset and crop, not by dataUrl", () => {
    const before = tireModel({ mainImage: placement });
    const after = tireModel({
      mainImage: { ...placement, assetId: "asset-2", alt: "другая" },
    });
    const changes = diffDraft(before, after, "tire-model", [
      { id: "asset-1", dataUrl: "data:old" },
      { id: "asset-2", dataUrl: "data:new" },
    ]);
    const image = changes.find((change) => change.path === "mainImage");
    expect(image?.before).toMatchObject({ kind: "image", assetId: "asset-1", previewUrl: "data:old" });
    expect(image?.after).toMatchObject({ kind: "image", assetId: "asset-2", previewUrl: "data:new" });
    expect(diffDraft(before, tireModel({ mainImage: { ...placement } }), "tire-model")).toEqual([]);
  });
});

describe("field catalog coverage", () => {
  const samples: [StatusEntity, unknown][] = [
    ["tire-model", tireModel({ features: [{ id: "f1", key: "grip", title: "Сцепление", description: "текст" }], gallery: [placement] })],
    [
      "tire-direction",
      {
        id: "d1",
        name: "Магистральные",
        slug: "long-haul",
        description: "",
        shortDescription: "",
        sortOrder: 1,
        showInMenu: true,
        selectionVehicleTypes: ["truck"],
        selectionConditions: [],
      },
    ],
    [
      "wheel-type",
      { id: "t1", name: "Кованые", slug: "forged", description: "", sortOrder: 1, showInMenu: true },
    ],
    [
      "wheel-model",
      {
        id: "w1",
        name: "WR01",
        slug: "wr01",
        wheelTypeId: "t1",
        series: "A",
        material: "alloy",
        constructionMethod: "forged",
        fitmentNotes: "",
        descriptionShort: "",
        descriptionLong: "",
        gallery: [],
        documents: [],
        showInMenu: false,
        menuOrder: 0,
        variants: [{ id: "v1", sizeLabel: "9.5J x 22", pcd: "10x335", color: "black", priceOnRequest: true, available: true }],
      },
    ],
    [
      "shop-category",
      {
        id: "c1",
        name: "Колпаки",
        slug: "caps",
        description: "",
        sortOrder: 1,
        showInMenu: true,
        carousel: [{ id: "s1", image: placement }],
      },
    ],
    [
      "shop-product",
      {
        id: "p1",
        name: "Колпак",
        slug: "cap",
        categoryId: "c1",
        descriptionShort: "",
        descriptionLong: "",
        priceOnRequest: true,
        gallery: [],
        variants: [{ id: "pv1", color: "чёрный", size: "22.5", sku: "SKU", priceOnRequest: true, available: true }],
      },
    ],
    [
      "page",
      {
        id: "about",
        seoTitle: "",
        seoDescription: "",
        hero: { eyebrow: "", title: "", lead: "" },
        documents: [{ assetId: "a1", title: "файл" }],
      },
    ],
    [
      "material",
      {
        id: "m1",
        kind: "article",
        title: "Статья",
        slug: "article",
        excerpt: "",
        body: "текст",
        gallery: [],
        showInMenu: false,
        menuOrder: 0,
      },
    ],
  ];

  it("catalogues every flattened path of each entity sample", () => {
    for (const [entityType, draft] of samples) {
      for (const path of flattenDraftPaths(draft)) {
        expect(isCataloguedField(entityType, path), `${entityType} ${path}`).toBe(true);
      }
    }
  });
});
