import { describe, expect, it } from "vitest";
import { resolveTireIqArticleCover } from "./tireIqVisuals";

describe("resolveTireIqArticleCover", () => {
  it("uses a selected CMS image", () => {
    expect(resolveTireIqArticleCover({
      slug: "cold-inflation-pressure-check",
      imageUrl: "/media/selected-cover.webp",
      imageConfigured: true,
    })).toBe("/media/selected-cover.webp");
  });

  it("keeps the system cover for legacy articles with no configured image", () => {
    expect(resolveTireIqArticleCover({
      slug: "cold-inflation-pressure-check",
      imageUrl: null,
      imageConfigured: false,
    })).toBe("/images/tire-iq/production/VIS-21-contact-optimal-web.webp");
  });

  it("does not restore a system cover after an editor explicitly clears it", () => {
    expect(resolveTireIqArticleCover({
      slug: "cold-inflation-pressure-check",
      imageUrl: null,
      imageConfigured: true,
    })).toBeNull();
  });
});
