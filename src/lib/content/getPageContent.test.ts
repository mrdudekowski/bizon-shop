import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getPageContent CMS source of truth", () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.CONTENT_API_URL;

  beforeEach(() => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.CONTENT_API_URL;
    else process.env.CONTENT_API_URL = originalUrl;
  });

  it("does not show code defaults when the configured content API is unavailable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("connection refused")) as unknown as typeof fetch;
    const [{ getPageContent }, { PublishedApiError }] = await Promise.all([
      import("./getPageContent"),
      import("./publishedClient"),
    ]);

    await expect(getPageContent("home")).rejects.toBeInstanceOf(PublishedApiError);
  });

  it("does not substitute defaults when a CMS-backed page endpoint is missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 })) as unknown as typeof fetch;
    const [{ getPageContent }, { PublishedApiError }] = await Promise.all([
      import("./getPageContent"),
      import("./publishedClient"),
    ]);

    await expect(getPageContent("home")).rejects.toBeInstanceOf(PublishedApiError);
  });

  it("keeps the explicit code preview when the API is not configured in development", async () => {
    delete process.env.CONTENT_API_URL;
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    const [{ getPageContent }, { getPageDefaults }] = await Promise.all([
      import("./getPageContent"),
      import("./pages/defaults"),
    ]);

    await expect(getPageContent("home")).resolves.toEqual(getPageDefaults("home"));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
