import { describe, expect, it } from "vitest";

import {
  enforceTireModelWorkflowData,
  enforceTireVariantWorkflowData,
} from "./validateTirePublication";

const publishableModel = {
  modelCode: "DSR188",
  name: "DSR188",
  slug: "dsr188",
  tireType: 1,
  mainImage: 10,
  status: "published",
};

const publishableVariant = {
  sku: "DSR188-1",
  tireModel: 1,
  sizeRaw: "315/80R22.5",
  sizeNormalized: "315/80R22.5",
  status: "published",
};

describe("enforceTireModelWorkflowData", () => {
  it("allows a complete model to publish", () => {
    expect(
      enforceTireModelWorkflowData({
        data: publishableModel,
        original: { ...publishableModel, status: "draft" },
      }),
    ).toMatchObject({ status: "published" });
  });

  it("blocks publication without a main image using a Russian error", () => {
    expect(() =>
      enforceTireModelWorkflowData({
        data: { ...publishableModel, mainImage: null },
        original: { ...publishableModel, status: "draft" },
      }),
    ).toThrow("Добавьте главное изображение");
  });

  it("allows commercial-only edits while the model remains draft", () => {
    expect(
      enforceTireModelWorkflowData({
        data: { price: 1000 },
        original: { ...publishableModel, status: "draft" },
      }),
    ).toEqual({ price: 1000 });
  });

  it("returns only incoming data on successful publish", () => {
    expect(
      enforceTireModelWorkflowData({
        data: publishableModel,
        original: { ...publishableModel, status: "draft" },
      }),
    ).toEqual(publishableModel);
  });
});

describe("enforceTireVariantWorkflowData", () => {
  it("allows a complete variant to publish against a published model", () => {
    expect(
      enforceTireVariantWorkflowData({
        data: publishableVariant,
        original: { ...publishableVariant, status: "draft" },
        model: publishableModel,
      }),
    ).toMatchObject({ status: "published" });
  });

  it("blocks publication without sku using a Russian error", () => {
    expect(() =>
      enforceTireVariantWorkflowData({
        data: { ...publishableVariant, sku: "" },
        original: { ...publishableVariant, status: "draft" },
        model: publishableModel,
      }),
    ).toThrow("Укажите SKU");
  });

  it("blocks publication while the linked model is draft", () => {
    expect(() =>
      enforceTireVariantWorkflowData({
        data: publishableVariant,
        original: { ...publishableVariant, status: "draft" },
        model: { ...publishableModel, status: "draft" },
      }),
    ).toThrow("Сначала опубликуйте модель шины");
  });

  it("allows commercial-only edits while the variant remains draft", () => {
    expect(
      enforceTireVariantWorkflowData({
        data: { price: 1000, availabilityStatus: "available" },
        original: { ...publishableVariant, status: "draft" },
      }),
    ).toEqual({
      price: 1000,
      availabilityStatus: "available",
    });
  });
});
