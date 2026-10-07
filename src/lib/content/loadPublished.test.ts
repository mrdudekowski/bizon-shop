import { afterEach, describe, expect, it, vi } from "vitest";

describe("loadPublished", () => {
  const originalUrl = process.env.CONTENT_API_URL;
  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalUrl === undefined) delete process.env.CONTENT_API_URL;
    else process.env.CONTENT_API_URL = originalUrl;
  });

  it("keeps a successful empty result distinct from an unavailable API", async () => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    const { loadPublished } = await import("./loadPublished");
    await expect(loadPublished(async () => [])).resolves.toEqual({ kind: "ok", value: [] });
  });

  it("reports disabled API configuration as unavailable without running the loader", async () => {
    process.env.CONTENT_API_URL = "  ";
    const { loadPublished } = await import("./loadPublished");
    const loader = vi.fn(async () => ["should not load"]);
    await expect(loadPublished(loader)).resolves.toEqual({ kind: "unavailable" });
    expect(loader).not.toHaveBeenCalled();
  });

  it("turns published API errors into an unavailable result", async () => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    const { loadPublished } = await import("./loadPublished");
    const { PublishedApiError } = await import("./publishedClient");
    await expect(loadPublished(async () => { throw new PublishedApiError("unavailable"); }))
      .resolves.toEqual({ kind: "unavailable" });
  });

  it("does not hide programming errors as an API outage", async () => {
    process.env.CONTENT_API_URL = "http://127.0.0.1:4000";
    const { loadPublished } = await import("./loadPublished");
    await expect(loadPublished(async () => { throw new Error("bug"); })).rejects.toThrow("bug");
  });
});
