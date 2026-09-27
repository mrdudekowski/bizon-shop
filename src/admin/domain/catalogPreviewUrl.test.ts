import { describe, expect, it } from "vitest";
import { resolveMediaPreviewUrl, resolveSiteCatalogPreview } from "./catalogPreviewUrl";

describe("resolveSiteCatalogPreview", () => {
  it("uses the public site's tire direction images", () => {
    expect(resolveSiteCatalogPreview("tbr", "https://bizon.ru")).toBe(
      "https://bizon.ru/images/premium/highway-fleet-portrait.png",
    );
    expect(resolveSiteCatalogPreview("otr", "https://bizon.ru")).toBe(
      "https://bizon.ru/images/premium/quarry-haul-truck.png",
    );
  });

  it("returns no fallback for unknown catalog slugs", () => {
    expect(resolveSiteCatalogPreview("unknown", "https://bizon.ru")).toBeNull();
  });

  it("resolves relative media URLs against the public site origin", () => {
    expect(resolveMediaPreviewUrl("/images/premium/highway-fleet-portrait.png", "https://bizon.ru")).toBe(
      "https://bizon.ru/images/premium/highway-fleet-portrait.png",
    );
  });

  it("maps CMS media file routes to the public site's media path", () => {
    expect(resolveMediaPreviewUrl("/api/media/file/tire.png", "https://bizon.ru")).toBe(
      "https://bizon.ru/media/tire.png",
    );
  });

  it("preserves absolute media URLs", () => {
    expect(resolveMediaPreviewUrl("https://cdn.example.com/media/tire.png", "https://bizon.ru")).toBe(
      "https://cdn.example.com/media/tire.png",
    );
  });
});
