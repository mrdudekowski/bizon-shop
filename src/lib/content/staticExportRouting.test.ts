import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config.mjs";

describe("public static export routing", () => {
  it("emits directory index pages for host-compatible trailing-slash routes", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.trailingSlash).toBe(true);
  });
});
