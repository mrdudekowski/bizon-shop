import { describe, expect, it } from "vitest";

import { patchFilterSearchParams } from "./filterUrlState";

describe("patchFilterSearchParams", () => {
  it("sets filter values and preserves unrelated query parameters", () => {
    const result = patchFilterSearchParams(
      new URLSearchParams("utm_source=newsletter&size=old&axle=drive"),
      ["size", "axle"],
      { size: "315/80R22.5", axle: "trailer" },
    );

    expect(result).toBe("utm_source=newsletter&size=315%2F80R22.5&axle=trailer");
  });

  it("removes cleared filter values without removing unrelated parameters", () => {
    const result = patchFilterSearchParams(
      new URLSearchParams("utm_campaign=spring&diameter=22&width=9"),
      ["diameter", "width"],
      { diameter: "", width: undefined },
    );

    expect(result).toBe("utm_campaign=spring");
  });

  it("returns an empty string when the last query value is cleared", () => {
    const result = patchFilterSearchParams(
      new URLSearchParams("size=315%2F80R22.5"),
      ["size"],
      { size: undefined },
    );

    expect(result).toBe("");
  });
});
