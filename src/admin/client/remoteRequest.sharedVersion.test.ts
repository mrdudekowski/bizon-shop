import { afterEach, describe, expect, it, vi } from "vitest";

import { browserAdminClient } from "./localStore";

const savedDraft = {
  id: "article-shared-client-qa",
  kind: "article" as const,
  title: "QA material",
  slug: "qa-material",
  excerpt: "",
  body: "",
  gallery: [],
  showInMenu: true,
  menuOrder: 0,
  taxonomy: [],
};

const record = (draft: typeof savedDraft) => ({
  id: savedDraft.id,
  draft,
  savedDraft: draft,
  publishedSnapshot: null,
  hidden: false,
  slugLocked: false,
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("remote admin client saved draft versions", () => {
  it("shares the loaded version when a different client instance saves the material", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_URL", "https://admin.example.test");
    const edited = { ...savedDraft, body: "QA-only body" };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: record(savedDraft) })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true, result: record(edited) })));
    vi.stubGlobal("fetch", fetchMock);

    await browserAdminClient().getMaterial(savedDraft.id);
    await browserAdminClient().saveMaterial(savedDraft.id, edited);

    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
      method: "saveMaterial",
      args: [savedDraft.id, edited, savedDraft],
    });
  });
});
