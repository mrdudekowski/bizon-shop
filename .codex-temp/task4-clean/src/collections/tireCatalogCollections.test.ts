import type { Field } from "payload";
import { describe, expect, it } from "vitest";

import { TireModels } from "./TireModels";
import { TireVariants } from "./TireVariants";

function children(field: Field): Field[] {
  if ("fields" in field && Array.isArray(field.fields)) return field.fields;
  if ("tabs" in field && Array.isArray(field.tabs)) {
    return field.tabs.flatMap((tab) => tab.fields);
  }
  return [];
}

function flatten(fields: Field[]): Field[] {
  return fields.flatMap((field) => [field, ...flatten(children(field))]);
}

function namedField(fields: Field[], name: string): Field {
  const field = flatten(fields).find(
    (candidate) => "name" in candidate && candidate.name === name,
  );
  if (!field) throw new Error(`Missing field ${name}`);
  return field;
}

describe("TireModels collection", () => {
  it("wires normalization and workflow hooks", () => {
    expect(TireModels.hooks?.beforeValidate).toHaveLength(1);
    expect(TireModels.hooks?.beforeChange).toHaveLength(2);
  });

  it("contains the target model fields and admin tabs", () => {
    const fields = TireModels.fields;
    expect(fields.some((field) => field.type === "tabs")).toBe(true);
    for (const name of [
      "modelCode",
      "positions",
      "applicationTypes",
      "features",
      "variants",
      "mainImage",
      "status",
    ]) {
      expect(namedField(fields, name)).toBeDefined();
    }
    for (const name of ["catalogId", "verificationStatus", "advantages"]) {
      expect(() => namedField(fields, name)).toThrow(`Missing field ${name}`);
    }
    expect(namedField(fields, "features")).toMatchObject({ type: "array" });
    expect(namedField(fields, "variants")).toMatchObject({
      type: "join",
      collection: "tire-variants",
      on: "tireModel",
    });
  });

  it("removes legacy taxonomy from the refactored model", () => {
    for (const name of [
      "applicationCategory",
      "series",
      "application",
      "axlePosition",
      "treadType",
      "selectionVehicleTypes",
      "selectionConditions",
      "selectionAxles",
    ]) {
      expect(() => namedField(TireModels.fields, name)).toThrow(`Missing field ${name}`);
    }
  });
});

describe("TireVariants collection", () => {
  it("uses the normalized size as admin title and wires workflow hooks", () => {
    expect(TireVariants.admin?.useAsTitle).toBe("sizeNormalized");
    expect(TireVariants.hooks?.beforeValidate).toHaveLength(1);
    expect(TireVariants.hooks?.beforeChange).toHaveLength(2);
  });

  it("contains target technical, commercial and workflow fields", () => {
    for (const name of [
      "sku",
      "sizeRaw",
      "sizeNormalized",
      "plyRatingPr",
      "maxLoadSingleKg",
      "price",
      "availabilityStatus",
      "status",
    ]) {
      expect(namedField(TireVariants.fields, name)).toBeDefined();
    }
    for (const name of [
      "catalogId",
      "verificationStatus",
      "publishBlocked",
      "sourceSnapshot",
    ]) {
      expect(() => namedField(TireVariants.fields, name)).toThrow(
        `Missing field ${name}`,
      );
    }
  });

  it("removes legacy aliases from the refactored variant", () => {
    for (const name of [
      "size",
      "sectionWidth",
      "aspectRatio",
      "rimDiameter",
      "loadIndex",
      "speedIndex",
      "plyRating",
      "overallDiameter",
      "weight",
      "recommendedRim",
      "available",
      "priceOnRequest",
    ]) {
      expect(() => namedField(TireVariants.fields, name)).toThrow(`Missing field ${name}`);
    }
  });
});
