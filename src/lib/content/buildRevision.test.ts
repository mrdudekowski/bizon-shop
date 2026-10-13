import { describe, expect, it, vi } from "vitest";
import {
  fetchPreviousMediaFile,
  fetchPreviousMediaManifest,
  fetchPreviousContentSnapshot,
  fetchPublishedSnapshot,
  fetchRevision,
  runStableRevisionBuild,
} from "../../../scripts/buildWithContentRevision.js";

const before = { schema: 1, revision: `sha256:${"a".repeat(64)}` };
const after = { schema: 1, revision: `sha256:${"b".repeat(64)}` };
const snapshotContent = {
  home: null,
  shopHome: null,
  stubs: {},
  articles: [],
  tires: { types: [], models: [] },
  wheels: { types: [], byType: [] },
  shop: { categories: [], products: [] },
};

describe("static build revision guard", () => {
  it("retries a transient 503 and returns the valid revision", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => before });
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(fetchRevision({ baseUrl: "https://backend.example", fetchImpl, wait })).resolves.toEqual(before);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(500);
  });

  it("stops after three transient failures without using a fallback revision", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(fetchRevision({ baseUrl: "https://backend.example", fetchImpl, wait }))
      .rejects.toThrow("Content revision API returned HTTP 503");

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([500, 1000]);
  });

  it("does not retry non-transient HTTP failures", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const wait = vi.fn();

    await expect(fetchRevision({ baseUrl: "https://backend.example", fetchImpl, wait }))
      .rejects.toThrow("Content revision API returned HTTP 401");

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });

  it("marks the export only when the revision stays stable throughout the build", async () => {
    const fetchRevision = vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(before);
    const runBuild = vi.fn().mockResolvedValue(undefined);
    const writeMarker = vi.fn().mockResolvedValue(undefined);

    await runStableRevisionBuild({ fetchRevision, runBuild, runSnapshot: undefined, writeMarker });

    expect(fetchRevision).toHaveBeenCalledTimes(2);
    expect(runBuild).toHaveBeenCalledOnce();
    expect(writeMarker).toHaveBeenCalledWith(before);
  });

  it("builds from one snapshot whose revision matches the initial revision", async () => {
    const publishedSnapshot = { ...before, content: { ...snapshotContent, articles: [{ slug: "one" }] } };
    const fetchRevision = vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(before);
    const fetchSnapshot = vi.fn().mockResolvedValue(publishedSnapshot);
    const runBuild = vi.fn().mockResolvedValue(undefined);
    const writeMarker = vi.fn().mockResolvedValue(undefined);

    await runStableRevisionBuild({ fetchRevision, fetchSnapshot, runBuild, writeMarker });

    expect(fetchSnapshot).toHaveBeenCalledOnce();
    expect(runBuild).toHaveBeenCalledWith(publishedSnapshot);
    expect(writeMarker).toHaveBeenCalledWith(before, undefined, publishedSnapshot);
  });

  it("refuses a snapshot that does not match the initial revision", async () => {
    const fetchRevision = vi.fn().mockResolvedValue(before);
    const runBuild = vi.fn();
    await expect(runStableRevisionBuild({
      fetchRevision,
      fetchSnapshot: vi.fn().mockResolvedValue({ ...after, content: snapshotContent }),
      runBuild,
      writeMarker: vi.fn(),
    })).rejects.toThrow("changed before the static build snapshot was captured");
    expect(runBuild).not.toHaveBeenCalled();
  });

  it("downloads a complete revisioned snapshot from the one-shot endpoint", async () => {
    const publishedSnapshot = { ...before, content: snapshotContent };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => publishedSnapshot });
    await expect(fetchPublishedSnapshot({ baseUrl: "https://backend.example/", fetchImpl })).resolves.toEqual(publishedSnapshot);
    expect(fetchImpl).toHaveBeenCalledWith(new URL("https://backend.example/v1/content/snapshot"), expect.objectContaining({
      cache: "no-store",
      redirect: "error",
    }));
  });

  it("reads a valid previous public release manifest and ignores an unsafe public-site URL", async () => {
    const manifest = { schema: 1, revision: before.revision, files: [] };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
    await expect(fetchPreviousMediaManifest({ publicSiteUrl: "https://site.example/", fetchImpl }))
      .resolves.toEqual({ siteUrl: new URL("https://site.example/"), manifest });
    expect(fetchImpl).toHaveBeenCalledWith(new URL("https://site.example/media-manifest.json"), expect.any(Object));

    await expect(fetchPreviousMediaManifest({ publicSiteUrl: "http://site.example/", fetchImpl })).resolves.toBeNull();
    await expect(fetchPreviousMediaManifest({ publicSiteUrl: "https://site.example/prefix", fetchImpl })).resolves.toBeNull();
  });

  it("reads only a complete archived content snapshot from the previous public release", async () => {
    const archivedSnapshot = { ...before, content: snapshotContent };
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => archivedSnapshot });
    await expect(fetchPreviousContentSnapshot({ publicSiteUrl: "https://site.example/", fetchImpl }))
      .resolves.toEqual(archivedSnapshot);
    expect(fetchImpl).toHaveBeenCalledWith(new URL("https://site.example/content-snapshot.json"), expect.any(Object));

    await expect(fetchPreviousContentSnapshot({
      publicSiteUrl: "https://site.example/",
      fetchImpl: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...archivedSnapshot, content: {} }) }),
    })).resolves.toBeNull();
  });

  it("downloads only safe same-origin media paths from the prior public release", async () => {
    const bytes = Buffer.from("previous media bytes");
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
    const siteUrl = new URL("https://site.example/");
    await expect(fetchPreviousMediaFile(`/snapshot-media/${"c".repeat(64)}.png`, siteUrl, fetchImpl)).resolves.toEqual(bytes);
    await expect(fetchPreviousMediaFile("/private/file", siteUrl, fetchImpl)).rejects.toThrow("Previous media path is invalid");
  });

  it("refuses to mark the export when published content changes during the build", async () => {
    const fetchRevision = vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(after);
    const writeMarker = vi.fn().mockResolvedValue(undefined);

    await expect(runStableRevisionBuild({
      fetchRevision,
      runBuild: vi.fn().mockResolvedValue(undefined),
      runSnapshot: undefined,
      writeMarker,
    })).rejects.toThrow("Published content changed during the static build");

    expect(writeMarker).not.toHaveBeenCalled();
  });

  it("does not write a marker after the build fails", async () => {
    const writeMarker = vi.fn().mockResolvedValue(undefined);

    await expect(runStableRevisionBuild({
      fetchRevision: vi.fn().mockResolvedValue(before),
      runBuild: vi.fn().mockRejectedValue(new Error("build failed")),
      runSnapshot: undefined,
      writeMarker,
    })).rejects.toThrow("build failed");

    expect(writeMarker).not.toHaveBeenCalled();
  });
});
