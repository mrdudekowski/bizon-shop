import { afterEach, describe, expect, it, vi } from "vitest";

import { browserAdminClient } from "./localStore";

const draft = {
  id: "direction-1",
  name: "Летние шины",
  slug: "summer",
  description: "Описание",
  shortDescription: "Коротко",
  sortOrder: 1,
  showInMenu: true,
  selectionVehicleTypes: [],
  selectionConditions: [],
};

const record = (savedDraft: typeof draft) => ({
  id: draft.id,
  draft: savedDraft,
  savedDraft,
  publishedSnapshot: null,
  hidden: false,
  slugLocked: false,
  lastSavedBy: null,
  lastPublishedBy: null,
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("remote admin client", () => {
  it("uses the CMS loopback hostname for the local API so session cookies stay same-site", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_URL", "");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: [] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: [] })));
    vi.stubGlobal("fetch", fetchMock);

    for (const hostname of ["localhost", "127.0.0.1"]) {
      vi.stubGlobal("window", { location: { hostname } });
      await browserAdminClient().listPages();
    }

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://localhost:4000/v1/admin",
      "http://127.0.0.1:4000/v1/admin",
    ]);
  });
  it("sends the last loaded saved draft with remote saves", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_URL", "https://admin.example.test/");
    const edited = { ...draft, name: "Зимние шины" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: record(draft) })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: record(edited) })));
    vi.stubGlobal("fetch", fetchMock);
    const client = browserAdminClient();

    await client.getTireDirection(draft.id);
    await client.saveTireDirection(draft.id, edited);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://admin.example.test/v1/admin");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      method: "saveTireDirection",
      args: [draft.id, edited, draft],
    });
  });

  it("maps a rejected fetch to the network error", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_URL", "https://admin.example.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(browserAdminClient().listPages()).rejects.toMatchObject({ code: "network" });
  });

  it("preserves an API error code from a failed response", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_URL", "https://admin.example.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, code: "storage_unavailable" }))));

    await expect(browserAdminClient().listPages()).rejects.toMatchObject({ code: "storage_unavailable" });
  });

  it("keeps the edited draft in the submitted request when the server reports a conflict", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_URL", "https://admin.example.test");
    const edited = { ...draft, name: "Изменено во второй вкладке" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: record(draft) })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, code: "conflict" })));
    vi.stubGlobal("fetch", fetchMock);
    const client = browserAdminClient();
    await client.getTireDirection(draft.id);

    await expect(client.saveTireDirection(draft.id, edited)).rejects.toMatchObject({ code: "conflict" });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      method: "saveTireDirection",
      args: [draft.id, edited, draft],
    });
  });
});
