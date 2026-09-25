import { describe, expect, it, vi } from "vitest";

import {
  buildModelCodeFromSlug,
  buildTireVariantSku,
} from "@/lib/catalog/identity";
import {
  normalizeTireModelData,
  normalizeTireVariant,
  normalizeTireVariantData,
} from "./normalizeTireCatalog";
import { enforceTireVariantWorkflowData } from "./validateTirePublication";

describe("normalizeTireModelData", () => {
  it("builds modelCode from slug when modelCode is blank", () => {
    expect(
      normalizeTireModelData({
        slug: "bizon-dsr-188",
        modelCode: " ",
      }),
    ).toMatchObject({
      modelCode: buildModelCodeFromSlug("bizon-dsr-188"),
    });
  });
});

describe("normalizeTireVariantData", () => {
  it("parses size fields", () => {
    expect(
      normalizeTireVariantData({
        data: {
          sizeRaw: "315/80r22.5",
        },
      }),
    ).toMatchObject({
      sizeNormalized: "315/80R22.5",
      sizeFormat: "metric",
      nominalWidthMm: 315,
      aspectRatioPct: 80,
      constructionCode: "R",
      rimDiameterIn: 22.5,
    });
  });

  it("builds sku from parsed size and a populated parent model", () => {
    expect(
      normalizeTireVariantData({
        data: {
          sku: "",
          sizeRaw: "315/80r22.5",
          tireModel: { id: 1, modelCode: "DSR188" },
        },
      }),
    ).toMatchObject({
      sku: buildTireVariantSku("DSR188", "315/80R22.5"),
    });
  });

  it("builds sku from an existing normalized size", () => {
    expect(
      normalizeTireVariantData({
        data: {
          sku: null,
          sizeNormalized: "385/65R22.5",
          tireModel: { id: 1, modelCode: "S201" },
        },
      }),
    ).toMatchObject({
      sku: buildTireVariantSku("S201", "385/65R22.5"),
    });
  });

  it.each(["not-a-tire-size", ""])(
    "clears stale parsed fields when sizeRaw is %j",
    (sizeRaw) => {
      const normalized = normalizeTireVariantData({
        original: {
          status: "published",
          sku: "DSR188-315-80R22.5",
          tireModel: 1,
          sizeRaw: "315/80R22.5",
          sizeNormalized: "315/80R22.5",
          sizeFormat: "metric",
          nominalWidthMm: 315,
          aspectRatioPct: 80,
          constructionCode: "R",
          rimDiameterIn: 22.5,
          imperialWidthIn: null,
        },
        data: { sizeRaw },
      });

      expect(normalized).toMatchObject({
        sizeNormalized: null,
        sizeFormat: null,
        nominalWidthMm: null,
        aspectRatioPct: null,
        constructionCode: null,
        rimDiameterIn: null,
        imperialWidthIn: null,
      });
      expect(() =>
        enforceTireVariantWorkflowData({
          data: normalized,
          model: { status: "published" },
        }),
      ).toThrow("Укажите размер, который система может разобрать");
    },
  );
});

describe("normalizeTireVariant", () => {
  it("keeps a relationship id while resolving modelCode for a blank sku", async () => {
    const findByID = vi.fn().mockResolvedValue({
      id: 7,
      modelCode: "DSR188",
      slug: "bizon-dsr-188",
    });

    const result = await normalizeTireVariant({
      data: {
        sku: "",
        sizeNormalized: "315/80R22.5",
        tireModel: 7,
      },
      originalDoc: null,
      req: { payload: { findByID } },
    } as never);

    expect(result).toMatchObject({
      sku: buildTireVariantSku("DSR188", "315/80R22.5"),
      tireModel: 7,
    });
  });
});
