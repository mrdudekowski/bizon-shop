import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getPageContent API outage fallback", () => {
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

  it("keeps the code-managed home page when the content API is unavailable", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("connection refused")) as unknown as typeof fetch;
    const [{ getPageContent }, { getPageDefaults }] = await Promise.all([
      import("./getPageContent"),
      import("./pages/defaults"),
    ]);

    await expect(getPageContent("home")).resolves.toEqual(getPageDefaults("home"));
  });
});
