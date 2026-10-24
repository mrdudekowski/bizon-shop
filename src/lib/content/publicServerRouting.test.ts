import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config.mjs";

describe("public static routing", () => {
  it("keeps trailing-slash static export for build-time SEO", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.trailingSlash).toBe(true);
  });
});
