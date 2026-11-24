// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

const publishedApi = vi.hoisted(() => ({
  json: vi.fn(),
  list: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("@/lib/content/browserPublishedClient", () => ({
  fetchBrowserPublishedJson: publishedApi.json,
  fetchBrowserPublishedList: publishedApi.list,
}));

vi.mock("./TireModelStage", () => ({
  TireModelStage: ({ model, modelPath }: { model: { name: string }; modelPath: string }) =>
    createElement("div", { "data-runtime-model": modelPath }, model.name),
}));

import { TireModelRuntimeRoute } from "./TireModelRuntimeRoute";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const model = {
  id: "tire-1",
  slug: "d930",
  name: "BIZON D930",
  tireTypeSlug: "tbr",
  tireTypeName: "TBR — грузовые шины",
  applicationTypes: ["regional"],
  brand: "BIZON TBR",
  descriptionShort: "Модель для региональных маршрутов",
  descriptionLong: "Описание модели",
  gallery: [],
  advantages: [],
  documents: [],
  selectionAxles: [],
  showInMenu: true,
  menuOrder: 1,
};

describe("TireModelRuntimeRoute", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    publishedApi.json.mockReset();
    publishedApi.list.mockReset();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  function mount() {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    root.render(createElement(TireModelRuntimeRoute));
  }

  it("loads and renders the published model and its variants from the URL", async () => {
    window.history.replaceState({}, "", "/models/view/?type=tbr&model=d930");
    publishedApi.json.mockResolvedValue(model);
    publishedApi.list.mockResolvedValue([{ id: "variant-1", size: "315/80R22.5" }]);

    await act(async () => mount());

    expect(publishedApi.json).toHaveBeenCalledWith(
      "/v1/tires/models/tbr/d930",
      expect.any(AbortSignal),
    );
    expect(publishedApi.list).toHaveBeenCalledWith(
      "/v1/tires/models/tire-1/variants",
      expect.any(AbortSignal),
    );
    expect(host.querySelector('[data-runtime-model="/models/view/?type=tbr&model=d930"]')?.textContent)
      .toBe("BIZON D930");
  });

  it("shows a loading state while the published model request is pending", async () => {
    window.history.replaceState({}, "", "/models/view/?type=tbr&model=d930");
    publishedApi.json.mockImplementation(() => new Promise(() => undefined));

    await act(async () => mount());

    expect(host.textContent).toContain("Загружаем модель");
  });

  it("shows a return-to-catalog message for missing model parameters", async () => {
    window.history.replaceState({}, "", "/models/view/?type=tbr");

    await act(async () => mount());

    expect(host.textContent).toContain("Не указана модель");
    expect(host.querySelector('a[href="/models/"]')?.textContent).toContain("каталогу шин");
    expect(publishedApi.json).not.toHaveBeenCalled();
  });

  it("shows a retryable message when the published API is unavailable", async () => {
    window.history.replaceState({}, "", "/models/view/?type=tbr&model=d930");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    publishedApi.json.mockRejectedValue(new Error("offline"));

    await act(async () => mount());

    expect(host.textContent).toContain("Не удалось загрузить страницу модели");
    expect(host.querySelector("button")?.textContent).toBe("Попробовать ещё раз");
  });
});
