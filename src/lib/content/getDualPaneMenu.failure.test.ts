import { afterEach, describe, expect, it, vi } from "vitest";

describe("dual pane menu when the published API is unavailable", () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.CONTENT_API_URL;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CONTENT_API_URL;
    else process.env.CONTENT_API_URL = originalUrl;
    vi.resetModules();
  });

  it("keeps the site-wide menu available without dynamic catalog entries", async () => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    const { getMainDualPaneMenu, getShopDualPaneMenu } = await import("./getDualPaneMenu");

    const [main, shop] = await Promise.all([getMainDualPaneMenu(), getShopDualPaneMenu()]);
    expect(main.sections.map((section) => section.id)).toEqual([
      "models", "shop", "branding", "tire-iq", "about",
    ]);
    expect(main.sections.find((section) => section.id === "models")?.items).toEqual([]);
    expect(shop.sections.find((section) => section.id === "wheels")?.items).toEqual([]);
    expect(shop.sections.find((section) => section.id === "buyers")?.items.length).toBeGreaterThan(0);
  });
});
