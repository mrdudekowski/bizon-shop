import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("publishedClient", () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.CONTENT_API_URL;

  beforeEach(() => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("throws a safe error when fetch throws a network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const { fetchPublishedJson, PublishedApiError } = await import("./publishedClient");
    await expect(fetchPublishedJson("/v1/tires/types/tbr")).rejects.toBeInstanceOf(PublishedApiError);
  });

  it("throws a safe error for server failures instead of returning empty content", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    const { fetchPublishedJson, PublishedApiError } = await import("./publishedClient");
    await expect(fetchPublishedJson("/v1/shop/products")).rejects.toBeInstanceOf(PublishedApiError);
  });

  it("distinguishes not found, unavailable and invalid JSON responses", async () => {
    const { fetchPublishedResult } = await import("./publishedClient");
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    await expect(fetchPublishedResult("/v1/shop/products/missing")).resolves.toEqual({ kind: "not_found" });

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    await expect(fetchPublishedResult("/v1/shop/products")).resolves.toEqual({ kind: "unavailable" });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError("bad json"); },
    }) as unknown as typeof fetch;
    await expect(fetchPublishedResult("/v1/shop/products")).resolves.toEqual({ kind: "invalid_payload" });
  });

  it("reports disabled configuration separately from an unavailable API", async () => {
    const { fetchPublishedResult } = await import("./publishedClient");
    process.env.CONTENT_API_URL = "  ";

    await expect(fetchPublishedResult("/v1/shop/products")).resolves.toEqual({ kind: "disabled" });
  });

  it("requires list endpoints to return an array and treats a missing route as unavailable", async () => {
    const { fetchPublishedList, PublishedApiError } = await import("./publishedClient");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ products: [] }),
    }) as unknown as typeof fetch;
    await expect(fetchPublishedList("/v1/shop/products"))
      .rejects.toMatchObject({ kind: "invalid_payload" });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ ok: false }),
    }) as unknown as typeof fetch;
    await expect(fetchPublishedList("/v1/shop/products"))
      .rejects.toBeInstanceOf(PublishedApiError);
  });

  it("rejects a list containing an item that fails its endpoint contract", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "x-request-id": "req-invalid-item" }),
      json: async () => [{ slug: "valid" }, { name: "missing slug" }],
    }) as unknown as typeof fetch;

    const { fetchPublishedList } = await import("./publishedClient");
    await expect(fetchPublishedList("/v1/shop/categories", (item) =>
      typeof item === "object" && item !== null && "slug" in item,
    )).rejects.toMatchObject({ kind: "invalid_payload" });

    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toMatchObject({
      reason: "invalid_payload",
      requestId: "req-invalid-item",
    });
  });

  it("logs sanitized failure details without query values or response content", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({ "x-request-id": "req-17" }),
    }) as unknown as typeof fetch;

    const { fetchPublishedResult } = await import("./publishedClient");
    await fetchPublishedResult("/v1/shop/products?category=private-category");

    const record = JSON.parse(String(warn.mock.calls[0]?.[0]));
    expect(record).toMatchObject({
      event: "published_api.failure",
      path: "/v1/shop/products",
      status: 503,
      requestId: "req-17",
      reason: "http_error",
    });
    expect(String(warn.mock.calls[0]?.[0])).not.toContain("private-category");
  });
});
