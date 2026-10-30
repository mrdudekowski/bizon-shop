// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import { PlacementFields, ProductPhotoFields } from "./PlacementFields";
import { PAGE_IMAGE_FRAMES } from "@/admin/pages/pageImageFrame";

const originalPlacement = {
  assetId: "asset-original",
  alt: "Фото",
  focalX: 0.5,
  focalY: 0.5,
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

beforeEach(() => {
  const NativeURL = URL;
  class TestURL extends NativeURL {
    static createObjectURL = vi.fn(() => "blob:uploaded-preview");
    static revokeObjectURL = vi.fn();
  }
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  vi.stubGlobal("URL", TestURL);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PlacementFields upload flow", () => {
  it("limits image file selection to formats supported by the backend", async () => {
    mockState.client = { listAssets: vi.fn().mockResolvedValue([]) };
    const user = userEvent.setup();
    render(createElement(PlacementFields, { label: "Фото", value: undefined, onChange: vi.fn(), showFocus: false }));
    expect(screen.queryByText("Загрузить фото")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    const input = await screen.findByLabelText("Файл для библиотеки") as HTMLInputElement;
    expect(screen.getByRole("button", { name: "Загрузить" })).toBeTruthy();
    expect(input.accept).toContain(".jpg,.jpeg,.png,.webp");
    expect(input.accept).not.toContain("application/pdf");
  });

  it("selects an unused library image and preserves placement settings", async () => {
    const onChange = vi.fn();
    const listAssets = vi.fn().mockResolvedValue([
      { id: "asset-free", name: "unused.jpg", mimeType: "image/jpeg", dataUrl: "/media/unused.jpg", usedBy: [] },
      { id: "asset-used", name: "used.jpg", mimeType: "image/jpeg", dataUrl: "/media/used.jpg", usedBy: ["Главная"] },
    ]);
    mockState.client = { listAssets };
    const user = userEvent.setup();
    const value = { ...originalPlacement, alt: "Сохранить подпись", focalX: 0.2 };
    render(createElement(PlacementFields, { label: "Фото для карусели", value, onChange, showFocus: false }));

    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));

    expect(await screen.findByRole("dialog", { name: "Выбрать изображение" })).toBeTruthy();
    expect(await screen.findByText("unused.jpg")).toBeTruthy();
    expect((screen.getByRole("dialog").querySelector("img") as HTMLImageElement).src).toBe("http://localhost:3000/media/unused.jpg");
    expect(screen.queryByText("used.jpg")).toBeNull();
    await user.click(screen.getByRole("button", { name: /unused.jpg/ }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ assetId: "asset-free", alt: "Сохранить подпись", focalX: 0.2 }));
  });

  it("can include already-used images when the editor explicitly asks to show them", async () => {
    mockState.client = { listAssets: vi.fn().mockResolvedValue([
      { id: "asset-used", name: "used.jpg", mimeType: "image/jpeg", dataUrl: "/media/used.jpg", usedBy: ["Главная"] },
    ]) };
    const user = userEvent.setup();
    render(createElement(PlacementFields, { label: "Фото", value: undefined, onChange: vi.fn(), showFocus: false }));

    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.click(await screen.findByLabelText("Показывать используемые"));

    expect(await screen.findByText("used.jpg")).toBeTruthy();
    expect(screen.getByText("Используется: Главная")).toBeTruthy();
  });

  it("shows upload progress and adds the uploaded image placement", async () => {
    let finishUpload!: (result: { id: string }) => void;
    const createAsset = vi.fn(() => new Promise<{ id: string }>((resolve) => { finishUpload = resolve; }));
    const onChange = vi.fn();
    mockState.client = { createAsset, listAssets: vi.fn().mockResolvedValue([]) };
    const user = userEvent.setup();
    render(createElement(PlacementFields, { label: "Фото главной", value: undefined, onChange, showFocus: false }));

    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.upload(await screen.findByLabelText("Файл для библиотеки"), new File(["image"], "hero.png", { type: "image/png" }));
    expect(screen.getByText("Загружаем…")).toBeTruthy();
    expect(createAsset).toHaveBeenCalledWith(expect.objectContaining({ name: "hero.png", mimeType: "image/png" }));

    await act(async () => { finishUpload({ id: "asset-uploaded" }); });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ assetId: "asset-uploaded", alt: "", focalX: 0.5 }));
  });

  it("replaces a selected image and can cancel its pending replacement", async () => {
    const replaceAsset = vi.fn().mockResolvedValue({ id: "asset-original", replacementAssetId: "asset-replacement" });
    const cancelAssetReplacement = vi.fn().mockResolvedValue(undefined);
    const listAssets = vi.fn().mockResolvedValue([{ id: "asset-original", name: "old.png", mimeType: "image/png", dataUrl: "/media/old.png", usedBy: [], replacementPending: false }]);
    const onChange = vi.fn();
    mockState.client = { replaceAsset, cancelAssetReplacement, listAssets };
    const user = userEvent.setup();
    render(createElement(PlacementFields, { label: "Фото главной", value: originalPlacement, onChange, showFocus: false }));

    await screen.findByRole("img", { name: "Фото" });
    await user.upload(screen.getByLabelText("Фото главной: файл"), new File(["image"], "new.png", { type: "image/png" }));
    expect(replaceAsset).toHaveBeenCalledWith("asset-original", expect.objectContaining({ name: "new.png", mimeType: "image/png" }));
    expect(await screen.findByText("Новое фото появится на сайте после публикации.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Отменить замену" }));

    expect(cancelAssetReplacement).toHaveBeenCalledWith("asset-original");
    expect(onChange).toHaveBeenLastCalledWith(originalPlacement);
  });

  it("announces a rejected upload to the user", async () => {
    mockState.client = { createAsset: vi.fn().mockRejectedValue(new Error("storage offline")), listAssets: vi.fn().mockResolvedValue([]) };
    const user = userEvent.setup();
    render(createElement(PlacementFields, { label: "Фото главной", value: undefined, onChange: vi.fn(), showFocus: false }));

    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.upload(await screen.findByLabelText("Файл для библиотеки"), new File(["image"], "broken.png", { type: "image/png" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("adds product image uploads to the gallery callback", async () => {
    mockState.client = {
      createAsset: vi.fn().mockResolvedValue({ id: "asset-gallery" }),
      listAssets: vi.fn().mockResolvedValue([{ id: "asset-original", name: "cover.png", mimeType: "image/png", dataUrl: "/media/cover.png", usedBy: [] }]),
    };
    const onGalleryChange = vi.fn();
    const user = userEvent.setup();
    render(createElement(ProductPhotoFields, { cover: originalPlacement, gallery: [], onCoverChange: vi.fn(), onGalleryChange }));

    await screen.findByRole("img", { name: "Фото" });
    await user.click(screen.getByRole("button", { name: "Выбрать фото из галереи" }));
    const input = await screen.findByLabelText("Файл для библиотеки") as HTMLInputElement;
    expect(input.accept).toBe(".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp");
    await user.upload(input, new File(["image"], "gallery.png", { type: "image/png" }));

    expect(onGalleryChange).toHaveBeenCalledWith([expect.objectContaining({ assetId: "asset-gallery" })]);
  });

  it("adds a library image to product photos without duplicating current selections", async () => {
    const onGalleryChange = vi.fn();
    mockState.client = {
      listAssets: vi.fn().mockResolvedValue([
        { id: "asset-original", name: "cover.png", mimeType: "image/png", dataUrl: "/media/cover.png", usedBy: ["Товар"] },
        { id: "asset-spare", name: "spare.png", mimeType: "image/png", dataUrl: "/media/spare.png", usedBy: [] },
      ]),
    };
    const user = userEvent.setup();
    render(createElement(ProductPhotoFields, { cover: originalPlacement, gallery: [], onCoverChange: vi.fn(), onGalleryChange }));

    await screen.findByRole("img", { name: "Фото" });
    await user.click(screen.getByRole("button", { name: "Выбрать фото из галереи" }));
    expect(await screen.findByText("spare.png")).toBeTruthy();
    expect(screen.queryByText("cover.png")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Выбрать spare.png" }));
    expect(onGalleryChange).toHaveBeenCalledWith([expect.objectContaining({ assetId: "asset-spare" })]);
  });

  it("crops a page preview like the guest frame and leaves the product square alone", async () => {
    const css = readFileSync("src/admin/pages/pageImageFrame.module.css", "utf8");
    const productCss = readFileSync("src/admin/media/PlacementFields.module.css", "utf8");
    expect(css).toMatch(/object-fit:\s*cover/);
    expect(css).toMatch(/data-page-frame="page-hero"\]\s*\{\s*aspect-ratio:\s*5\s*\/\s*2/);
    expect(css).not.toMatch(/data-page-frame="page-hero"\]\s*\{\s*aspect-ratio:\s*1\s*\/\s*1/);
    expect(css).toMatch(/data-page-frame="shop-hero"\] \.image\s*\{\s*object-position:\s*left center/);
    expect(productCss).toMatch(/\.previewShot\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/);

    mockState.client = {
      listAssets: vi.fn().mockResolvedValue([
        { id: "asset-original", name: "hero.png", mimeType: "image/png", dataUrl: "/media/hero.png", usedBy: [] },
      ]),
    };
    const { rerender } = render(createElement(PlacementFields, {
      label: "Картинка шапки",
      frame: PAGE_IMAGE_FRAMES.pageHero,
      value: { ...originalPlacement, focalX: 0.2, focalY: 0.8 },
      onChange: vi.fn(),
    }));
    const pageShot = await screen.findByLabelText("Предпросмотр фото и точки фокуса");
    expect(pageShot.getAttribute("data-page-frame")).toBe("page-hero");
    expect(pageShot.querySelector("img")?.style.getPropertyValue("--frame-position")).toBe("20% 80%");
    expect(screen.getByRole("button", { name: /Точка фокуса/ })).toBeTruthy();

    rerender(createElement(PlacementFields, {
      label: "Фото",
      value: originalPlacement,
      onChange: vi.fn(),
    }));
    const productShot = await screen.findByLabelText("Предпросмотр фото и точки фокуса");
    expect(productShot.hasAttribute("data-page-frame")).toBe(false);
  });
});
