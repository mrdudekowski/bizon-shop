import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";

describe("sitemap during published API outage", () => {
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.CONTENT_API_URL;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.CONTENT_API_URL;
    else process.env.CONTENT_API_URL = originalApiUrl;
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("returns static page URLs when the content API is unavailable", async () => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toContain("https://example.test/");
    expect(entries.some((entry) => entry.url.includes("/shop/product/"))).toBe(false);
  });
});
