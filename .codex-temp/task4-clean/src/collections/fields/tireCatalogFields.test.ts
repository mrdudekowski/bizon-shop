import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import {
  TIRE_APPLICATION_OPTIONS,
  TIRE_POSITION_OPTIONS,
  TIRE_SPEED_SYMBOL_OPTIONS,
  tireCommercialFields,
  tireModelFeaturesField,
  tireModelTaxonomyFields,
  tireVariantIdentityFields,
  tireVariantTechnicalFields,
} from "./tireCatalogFields";

function childFields(field: Field): Field[] {
  if ("fields" in field && Array.isArray(field.fields)) return field.fields;
  if ("tabs" in field && Array.isArray(field.tabs)) {
    return field.tabs.flatMap((tab) => tab.fields);
  }
  return [];
}

function flattenFields(fields: Field[]): Field[] {
  return fields.flatMap((field) => [field, ...flattenFields(childFields(field))]);
}

function namedField(fields: Field[], name: string): Field {
  const field = flattenFields(fields).find(
    (candidate) => "name" in candidate && candidate.name === name,
  );
  if (!field) throw new Error(`Missing field ${name}`);
  return field;
}

describe("tire catalog Payload fields", () => {
  it("defines the complete target variant field set", () => {
    const names = flattenFields([
      ...tireVariantIdentityFields(),
      ...tireVariantTechnicalFields(),
      ...tireCommercialFields(),
    ])
      .filter((field): field is Field & { name: string } => "name" in field)
      .map((field) => field.name);

    expect(names).toEqual(
      expect.arrayContaining([
        "sku",
        "supplierSku",
        "sizeRaw",
        "sizeNormalized",
        "sizeFormat",
        "nominalWidthMm",
        "imperialWidthIn",
        "aspectRatioPct",
        "constructionCode",
        "rimDiameterIn",
        "plyRatingPr",
        "treadDepthMm",
        "standardRimIn",
        "pressureSingleKpa",
        "pressureDualKpa",
        "maxLoadSingleKg",
        "maxLoadDualKg",
        "loadIndexSingle",
        "loadIndexDual",
        "speedSymbol",
        "overallDiameterMm",
        "sectionWidthMm",
        "price",
        "availabilityStatus",
      ]),
    );
    for (const removedName of [
      "catalogId",
      "verificationStatus",
      "validationWarnings",
      "publishBlocked",
      "sourceSnapshot",
    ]) {
      expect(names).not.toContain(removedName);
    }
  });

  it("keeps generated variant SKU optional but unique and indexed", () => {
    const sku = namedField(tireVariantIdentityFields(), "sku");
    expect(sku).toMatchObject({
      type: "text",
      unique: true,
      index: true,
    });
    expect("required" in sku ? sku.required : undefined).not.toBe(true);
  });

  it("uses workbook-backed model taxonomy dictionaries", () => {
    expect(TIRE_POSITION_OPTIONS.map((option) => option.value)).toEqual([
      "steer",
      "drive",
      "trailer",
    ]);
    expect(TIRE_APPLICATION_OPTIONS.map((option) => option.value)).toEqual([
      "long-haul",
      "regional",
      "urban",
      "off-road",
      "winter",
      "snow-mud",
    ]);

    expect(namedField(tireModelTaxonomyFields(), "positions")).toMatchObject({
      type: "select",
      hasMany: true,
      options: TIRE_POSITION_OPTIONS,
    });
  });

  it("uses numeric Payload fields for filterable technical values", () => {
    const fields = tireVariantTechnicalFields();
    for (const name of [
      "nominalWidthMm",
      "imperialWidthIn",
      "aspectRatioPct",
      "rimDiameterIn",
      "plyRatingPr",
      "treadDepthMm",
      "maxLoadSingleKg",
      "loadIndexSingle",
    ]) {
      expect(namedField(fields, name)).toMatchObject({ type: "number" });
    }
  });

  it("uses only workbook-backed speed symbols", () => {
    expect(TIRE_SPEED_SYMBOL_OPTIONS.map((option) => option.value)).toEqual([
      "B",
      "F",
      "G",
      "J",
      "K",
      "L",
      "M",
    ]);
  });

  it("defaults commercial availability to on_request without default price", () => {
    const fields = tireCommercialFields();
    expect(namedField(fields, "availabilityStatus")).toMatchObject({
      type: "select",
      defaultValue: "on_request",
    });
    expect(namedField(fields, "price")).not.toHaveProperty("defaultValue");
  });

  it("embeds controlled model features", () => {
    const feature = tireModelFeaturesField();
    expect(feature).toMatchObject({
      name: "features",
      type: "array",
    });
    expect(namedField([feature], "key")).toMatchObject({ type: "select" });
    const childNames = childFields(feature)
      .filter((field): field is Field & { name: string } => "name" in field)
      .map((field) => field.name);
    expect(childNames).toEqual(["key", "title", "description"]);
  });
});
