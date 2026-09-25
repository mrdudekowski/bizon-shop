import { describe, expect, it } from "vitest";
import { buildModelCodeFromSlug, buildTireVariantSku } from "./identity";

describe("buildModelCodeFromSlug", () => {
  it("uppercases and strips non-alphanumerics", () => {
    expect(buildModelCodeFromSlug("dsr-188")).toBe("DSR188");
    expect(buildModelCodeFromSlug("  Nomad Pro ")).toBe("NOMADPRO");
  });

  it("falls back when empty", () => {
    expect(buildModelCodeFromSlug("")).toBe("MODEL");
  });
});

describe("buildTireVariantSku", () => {
  it("joins model code and normalized size", () => {
    expect(buildTireVariantSku("DSR188", "315/80R22.5")).toBe("DSR188-315-80R22.5");
  });

  it("collapses slashes and spaces in size", () => {
    expect(buildTireVariantSku("ATLAS", "12.00 R20")).toBe("ATLAS-12.00R20");
  });
});
