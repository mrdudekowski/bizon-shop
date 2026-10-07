import { describe, expect, it } from "vitest";

import { getModelApplicationCategories } from "./tireCategories";

describe("getModelApplicationCategories", () => {
  it("returns checked applications in catalog order", () => {
    expect(
      getModelApplicationCategories({
        applicationTypes: ["urban", "long_haul"],
      }).map((category) => category.value),
    ).toEqual(["long_haul", "urban"]);
  });

  it("ignores the legacy single category when nothing is checked", () => {
    const legacyModel: { applicationTypes?: string[]; applicationCategory: string } = {
      applicationCategory: "construction",
    };
    expect(
      getModelApplicationCategories(legacyModel).map(
        (category) => category.icon,
      ),
    ).toEqual([]);
  });

  it("accepts hyphenated CMS values", () => {
    expect(
      getModelApplicationCategories({ applicationTypes: ["long-haul", "off-road"] }).map(
        (category) => category.value,
      ),
    ).toEqual(["long_haul", "off_road"]);
  });
});
