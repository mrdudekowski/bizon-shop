import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("publishedClient", () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.CONTENT_API_URL;

  beforeEach(() => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) {
      delete process.env.CONTENT_API_URL;
    } else {
      process.env.CONTENT_API_URL = originalUrl;
    }
  });

  it("publishedApiEnabled is true only when CONTENT_API_URL is non-empty after trim", async () => {
    const { publishedApiEnabled } = await import("./publishedClient");

    process.env.CONTENT_API_URL = "  ";
    expect(publishedApiEnabled()).toBe(false);

    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    expect(publishedApiEnabled()).toBe(true);
  });

  it("joins CONTENT_API_URL and path with a single slash and uses cache no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ slug: "tbr" }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { fetchPublishedJson } = await import("./publishedClient");
    const result = await fetchPublishedJson<{ slug: string }>("/v1/tires/types/tbr");

    expect(result).toEqual({ slug: "tbr" });
    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/v1/tires/types/tbr", {
      cache: "no-store",
    });
  });

  it("returns null on HTTP 404 without throwing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ ok: false }),
    }) as unknown as typeof fetch;

    const { fetchPublishedJson } = await import("./publishedClient");
    await expect(fetchPublishedJson("/v1/tires/types/missing")).resolves.toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const { fetchPublishedJson } = await import("./publishedClient");
    await expect(fetchPublishedJson("/v1/tires/types/tbr")).resolves.toBeNull();
  });
});
