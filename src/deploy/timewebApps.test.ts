import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStaticSiteDeployStatus } from "./timewebApps";

const revision = `sha256:${"a".repeat(64)}`;
const jsonResponse = (value: unknown) => new Response(JSON.stringify(value), {
  headers: { "content-type": "application/json; charset=utf-8" },
});

describe("static site deployment revision verification", () => {
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    token: process.env.TIMEWEB_CLOUD_TOKEN,
    appId: process.env.TIMEWEB_PUBLIC_SITE_APP_ID,
    siteUrl: process.env.PUBLIC_SITE_URL,
  };

  beforeEach(() => {
    process.env.TIMEWEB_CLOUD_TOKEN = "test-token";
    process.env.TIMEWEB_PUBLIC_SITE_APP_ID = "test-app";
    process.env.PUBLIC_SITE_URL = "https://site.example";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries({
      TIMEWEB_CLOUD_TOKEN: originalEnvironment.token,
      TIMEWEB_PUBLIC_SITE_APP_ID: originalEnvironment.appId,
      PUBLIC_SITE_URL: originalEnvironment.siteUrl,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.restoreAllMocks();
  });

  it("reports matches only when the public marker contains the expected revision", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ deploys: [{ id: "deploy-1", status: "success" }] }))
      .mockResolvedValueOnce(jsonResponse({ schema: 1, revision }))
      .mockResolvedValueOnce(jsonResponse({ schema: 1, revision, files: [] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await getStaticSiteDeployStatus("deploy-1", revision);

    expect(result).toMatchObject({ status: "found", contentStatus: "matches", deploy: { status: "success" } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(`https://site.example/content-revision.json?expected=${"a".repeat(64)}`);
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe(`https://site.example/media-manifest.json?expected=${"a".repeat(64)}`);
  });

  it("does not treat an HTML fallback page as a published media manifest", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ deploys: [{ id: "deploy-html-fallback", status: "success" }] }))
      .mockResolvedValueOnce(jsonResponse({ schema: 1, revision }))
      .mockResolvedValueOnce(new Response("<!doctype html><html></html>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      })) as unknown as typeof fetch;

    const result = await getStaticSiteDeployStatus("deploy-html-fallback", revision);

    expect(result).toMatchObject({ status: "found", contentStatus: "unavailable" });
  });

  it("reports mismatch when the media manifest belongs to another revision", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ deploys: [{ id: "deploy-stale-manifest", status: "success" }] }))
      .mockResolvedValueOnce(jsonResponse({ schema: 1, revision }))
      .mockResolvedValueOnce(jsonResponse({ schema: 1, revision: `sha256:${"b".repeat(64)}`, files: [] })) as unknown as typeof fetch;

    const result = await getStaticSiteDeployStatus("deploy-stale-manifest", revision);

    expect(result).toMatchObject({ status: "found", contentStatus: "mismatch" });
  });

  it("reports mismatch when the exported site has an older published revision", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ deploys: [{ id: "deploy-2", status: "success" }] }))
      .mockResolvedValueOnce(jsonResponse({ schema: 1, revision: `sha256:${"b".repeat(64)}` })) as unknown as typeof fetch;

    const result = await getStaticSiteDeployStatus("deploy-2", revision);

    expect(result).toMatchObject({ status: "found", contentStatus: "mismatch" });
  });

  it("keeps content pending until the provider reports deployment success", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ deploys: [{ id: "deploy-3", status: "building_code" }] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await getStaticSiteDeployStatus("deploy-3", revision);

    expect(result).toMatchObject({ status: "found", contentStatus: "pending", deploy: { status: "building_code" } });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not fetch a revision marker from an invalid public origin", async () => {
    process.env.PUBLIC_SITE_URL = "http://site.example";
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ deploys: [{ id: "deploy-4", status: "success" }] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await getStaticSiteDeployStatus("deploy-4", revision);

    expect(result).toMatchObject({ status: "found", contentStatus: "unavailable" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("rejects malformed deployment IDs without making a provider request", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(getStaticSiteDeployStatus("../deploy-5", revision)).resolves.toEqual({ status: "not_found" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
