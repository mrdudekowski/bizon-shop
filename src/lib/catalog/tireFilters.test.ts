import { describe, expect, it } from "vitest";

import { filterTireModels, parseTireFilters } from "./tireFilters";

const models = [
  {
    slug: "regional-drive",
    applicationTypes: ["regional"],
    selectionAxles: ["drive"],
    sizes: ["315/80R22.5"],
  },
  {
    slug: "long-haul-steer",
    applicationTypes: ["long_haul"],
    selectionAxles: ["steer"],
    sizes: ["385/65R22.5"],
  },
] as const;

describe("tire catalog filters", () => {
  it("parses only known URL filters", () => {
    expect(
      parseTireFilters(
        new URLSearchParams("application=regional&axle=drive&junk=x"),
      ),
    ).toEqual({ application: "regional", axle: "drive" });
  });

  it("ignores unknown and blank filter values", () => {
    expect(
      parseTireFilters(
        new URLSearchParams("application=unknown&axle=front&size=%20%20"),
      ),
    ).toEqual({});
  });

  it("combines application, axle and size filters", () => {
    expect(
      filterTireModels(models, {
        application: "regional",
        axle: "drive",
        size: "315/80R22.5",
      }).map((model) => model.slug),
    ).toEqual(["regional-drive"]);
  });
});
