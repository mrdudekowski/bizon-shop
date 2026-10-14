import { describe, expect, it } from "vitest";

import { filterWheelModels, parseWheelFilters } from "./wheelFilters";
import type { CmsWheelModel, CmsWheelVariant } from "@/lib/content/types";

const models = [
  { id: "atlas", slug: "atlas", series: "Satin Black", designStyle: "Off-road" },
  { id: "ember", slug: "ember", series: " Bronze ", designStyle: "Street " },
  { id: "no-variants", slug: "no-variants" },
] as CmsWheelModel[];

const variants = [
  {
    id: "atlas-1",
    modelId: "atlas",
    sizeLabel: "17×8",
    diameter: 17,
    width: 8,
    pcd: "6×139.7",
    offsetET: 0,
    centerBore: 106.1,
    color: "Satin Black",
    priceOnRequest: true,
  },
  {
    id: "atlas-2",
    modelId: "atlas",
    sizeLabel: "18×9",
    diameter: 18,
    width: 9,
    pcd: "6×139.7",
    offsetET: 10,
    centerBore: 106.1,
    color: "Satin Black",
    priceOnRequest: true,
  },
  {
    id: "ember-1",
    modelId: "ember",
    sizeLabel: "17×8",
    diameter: 17,
    width: 8,
    pcd: "5×127",
    offsetET: -12,
    centerBore: 71.5,
    color: "Bronze",
    priceOnRequest: true,
  },
] as CmsWheelVariant[];

describe("wheel catalog filters", () => {
  it("combines filters on one variant and returns only its model", () => {
    expect(
      filterWheelModels(models, variants, {
        diameter: "18",
        pcd: "6×139.7",
      }).map((model) => model.id),
    ).toEqual(["atlas"]);
  });

  it("does not match a model by combining different variants", () => {
    expect(
      filterWheelModels(models, variants, {
        diameter: "17",
        offsetET: "10",
      }),
    ).toEqual([]);
  });

  it("keeps models with no variants when no filters are selected", () => {
    expect(filterWheelModels(models, variants, {}).map((model) => model.id)).toEqual([
      "atlas",
      "ember",
      "no-variants",
    ]);
  });

  it("filters by model series even when no variant dimensions are published", () => {
    expect(
      filterWheelModels(models, [], { series: "Bronze" }).map((model) => model.id),
    ).toEqual(["ember"]);
  });

  it("combines model style with technical variant filters", () => {
    expect(
      filterWheelModels(models, variants, { designStyle: "Street", diameter: "18" }),
    ).toEqual([]);
  });

  it("parses only filter values available in the catalog", () => {
    expect(
      parseWheelFilters(
        new URLSearchParams("diameter=17&pcd=unknown&junk=x"),
        models,
        variants,
      ),
    ).toEqual({ diameter: "17" });
  });
});
