import { describe, expect, it } from "vitest";
import {
  validateModelPublication,
  validateVariantPublication,
} from "./tireValidation";

describe("validateModelPublication", () => {
  it("allows publish when name, slug, tireType, and mainImage are set", () => {
    const result = validateModelPublication({
      name: "DSR 188",
      slug: "dsr-188",
      tireType: 1,
      mainImage: 10,
    });
    expect(result.canPublish).toBe(true);
    expect(result.warnings.filter((w) => w.severity === "critical")).toHaveLength(0);
  });

  it("blocks when mainImage is missing", () => {
    const result = validateModelPublication({
      name: "DSR 188",
      slug: "dsr-188",
      tireType: 1,
      mainImage: null,
    });
    expect(result.canPublish).toBe(false);
    expect(result.warnings.some((w) => w.field === "mainImage")).toBe(true);
  });

  it("does not require verificationStatus or catalogId", () => {
    const result = validateModelPublication({
      name: "DSR 188",
      slug: "dsr-188",
      tireType: 1,
      mainImage: 10,
    });
    expect(result.warnings.some((w) => w.field === "verificationStatus")).toBe(false);
    expect(result.warnings.some((w) => w.field === "catalogId")).toBe(false);
  });
});

describe("validateVariantPublication", () => {
  it("allows publish when sku, model published, and size parsed", () => {
    const result = validateVariantPublication({
      sku: "DSR188-315-80R22.5",
      parsedSize: true,
      sizeNormalized: "315/80R22.5",
      tireModel: 1,
      model: { status: "published" },
    });
    expect(result.canPublish).toBe(true);
  });

  it("blocks when sku missing", () => {
    const result = validateVariantPublication({
      sku: "",
      parsedSize: true,
      sizeNormalized: "315/80R22.5",
      tireModel: 1,
      model: { status: "published" },
    });
    expect(result.canPublish).toBe(false);
    expect(result.warnings.some((w) => w.field === "sku")).toBe(true);
  });

  it("blocks when linked model is not published", () => {
    const result = validateVariantPublication({
      sku: "DSR188-315-80R22.5",
      parsedSize: true,
      sizeNormalized: "315/80R22.5",
      tireModel: 1,
      model: { status: "draft" },
    });
    expect(result.canPublish).toBe(false);
    expect(result.warnings.some((w) => w.code === "model_not_publishable")).toBe(true);
  });

  it("does not require publishBlocked or verificationStatus", () => {
    const result = validateVariantPublication({
      sku: "X",
      parsedSize: true,
      sizeNormalized: "315/80R22.5",
      tireModel: 1,
      model: { status: "published" },
    });
    expect(result.warnings.some((w) => w.field === "publishBlocked")).toBe(false);
    expect(result.warnings.some((w) => w.field === "verificationStatus")).toBe(false);
  });
});
