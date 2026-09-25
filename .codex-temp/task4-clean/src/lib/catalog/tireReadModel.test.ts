import { describe, expect, it } from "vitest";

import type { CmsTireModel, CmsTireType } from "@/lib/cms/types";

import { buildTireCatalogReadModel } from "./tireReadModel";

const tbr = {
  slug: "tbr",
  name: "TBR",
  description: "Шины для грузового транспорта",
  shortDescription: "Грузовые шины",
  sortOrder: 1,
  showInMenu: true,
  selectionVehicleTypes: ["regional-truck"],
  selectionConditions: ["regional"],
} as CmsTireType;

const otr = {
  ...tbr,
  slug: "otr",
  name: "OTR",
  selectionVehicleTypes: ["quarry-special"],
  selectionConditions: ["off-road"],
} as CmsTireType;

const model = {
  id: "42",
  slug: "dsr158",
  name: "DSR158",
  tireTypeSlug: "tbr",
  tireTypeName: "TBR",
  applicationCategory: "regional",
  brand: "DOUBLESTAR",
  descriptionShort: "Региональная ведущая шина",
  descriptionLong: "Для региональных маршрутов",
  gallery: [],
  advantages: [],
  documents: [],
  selectionVehicleTypes: ["regional-truck"],
  selectionConditions: ["regional"],
  selectionAxles: ["drive"],
} as CmsTireModel;

describe("buildTireCatalogReadModel", () => {
  it("omits directions without models and hydrates canonical model data", async () => {
    const catalog = await buildTireCatalogReadModel(
      [tbr, otr],
      async (slug) => (slug === "tbr" ? [model] : []),
      async (modelId) => (modelId === "42" ? ["315/80R22.5"] : []),
    );

    expect(catalog.directions.map((direction) => direction.slug)).toEqual([
      "tbr",
    ]);
    expect(catalog.directions[0].models[0]).toMatchObject({
      slug: "dsr158",
      href: "/models/tbr/regional/dsr158",
      sizes: ["315/80R22.5"],
      selectionAxles: ["drive"],
    });
  });
});
