import { describe, expect, it, vi } from "vitest";
import { fetchRevision, runStableRevisionBuild } from "../../../scripts/buildWithContentRevision.js";

const before = { schema: 1, revision: `sha256:${"a".repeat(64)}` };
const after = { schema: 1, revision: `sha256:${"b".repeat(64)}` };

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

    await runStableRevisionBuild({ fetchRevision, runBuild, writeMarker });

    expect(fetchRevision).toHaveBeenCalledTimes(2);
    expect(runBuild).toHaveBeenCalledOnce();
    expect(writeMarker).toHaveBeenCalledWith(before);
  });

  it("refuses to mark the export when published content changes during the build", async () => {
    const fetchRevision = vi.fn().mockResolvedValueOnce(before).mockResolvedValueOnce(after);
    const writeMarker = vi.fn().mockResolvedValue(undefined);

    await expect(runStableRevisionBuild({
      fetchRevision,
      runBuild: vi.fn().mockResolvedValue(undefined),
      writeMarker,
    })).rejects.toThrow("Published content changed during the static build");

    expect(writeMarker).not.toHaveBeenCalled();
  });

  it("does not write a marker after the build fails", async () => {
    const writeMarker = vi.fn().mockResolvedValue(undefined);

    await expect(runStableRevisionBuild({
      fetchRevision: vi.fn().mockResolvedValue(before),
      runBuild: vi.fn().mockRejectedValue(new Error("build failed")),
      writeMarker,
    })).rejects.toThrow("build failed");

    expect(writeMarker).not.toHaveBeenCalled();
  });
});
