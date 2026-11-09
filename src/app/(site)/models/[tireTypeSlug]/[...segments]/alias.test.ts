import { describe, expect, it } from "vitest";

import { tireModelAliasTarget } from "./page";

describe("tireModelAliasTarget", () => {
  it("sends only a non-canonical model path to the static redirect", () => {
    expect(tireModelAliasTarget("/models/tbr/dsr158", "/models/tbr/long-haul/dsr158")).toBe(
      "/models/tbr/long-haul/dsr158",
    );
    expect(tireModelAliasTarget("/models/tbr/long-haul/dsr158", "/models/tbr/long-haul/dsr158")).toBeNull();
    expect(tireModelAliasTarget("/models/tbr/long-haul", undefined)).toBeNull();
  });
});
