import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBrowserTireCatalog } from "./browserTireCatalog";

describe("fetchBrowserTireCatalog", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads the published types and their current models for runtime page content", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      const body = path.endsWith("/v1/tires/types")
        ? [{ slug: "tbr", name: "Шины для грузовиков", description: "Текст", shortDescription: "Кратко", sortOrder: 0, showInMenu: true }]
        : path.endsWith("/v1/tires/types/tbr/models")
          ? [{ id: "1", slug: "new-model", name: "Новая модель", tireTypeSlug: "tbr", tireTypeName: "TBR", applicationTypes: [], brand: "BIZON", descriptionShort: "Описание", descriptionLong: "Подробно", gallery: ["https://s3.test/new.jpg"], advantages: [], documents: [], selectionAxles: [], showInMenu: true, menuOrder: 0 }]
          : [];
      return { ok: true, status: 200, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");

    const result = await fetchBrowserTireCatalog();

    expect(result.directions[0]?.models[0]).toMatchObject({
      name: "Новая модель",
      gallery: ["https://s3.test/new.jpg"],
      href: "/models/tbr/new-model",
      sizes: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
