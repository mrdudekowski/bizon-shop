import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBrowserPublishedJson } from "./browserPublishedClient";
import { readPublishedRevision } from "./readPublishedRevision";

vi.mock("./browserPublishedClient", () => ({ fetchBrowserPublishedJson: vi.fn() }));

describe("readPublishedRevision", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refreshes published content in development when the built revision file is absent", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    vi.mocked(fetchBrowserPublishedJson).mockResolvedValue({ schema: 1, revision: "sha256:local" });

    await expect(readPublishedRevision()).resolves.toBe(true);
    expect(fetchBrowserPublishedJson).toHaveBeenCalledWith("/v1/content/revision", undefined);
  });

  it("does not refresh a production page when its built revision file is absent", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    vi.mocked(fetchBrowserPublishedJson).mockResolvedValue({ schema: 1, revision: "sha256:live" });

    await expect(readPublishedRevision()).resolves.toBe(false);
  });
});
