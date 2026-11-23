// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import { PlacementFields, ProductPhotoFields } from "./PlacementFields";
import type { ImagePlacement } from "@/admin/domain/types";
import { PAGE_IMAGE_FRAMES } from "@/admin/pages/pageImageFrame";
import { PageHeroImageFields } from "@/admin/pages/PageHeroImageFields";
import { pageHeroPreviewGeometry, pageHeroReferenceViewport } from "@/admin/pages/pageHeroPreviewGeometry";

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

  it("does not cancel an asset-wide replacement when canvas hero selects another library asset", async () => {
    const cancelAssetReplacement = vi.fn().mockResolvedValue(undefined);
    mockState.client = { cancelAssetReplacement, listAssets: vi.fn().mockResolvedValue([
      { id: "asset-original", name: "old.png", mimeType: "image/png", dataUrl: "/media/old.png", usedBy: [], replacementPending: true },
      { id: "asset-next", name: "next.png", mimeType: "image/png", dataUrl: "/media/next.png", usedBy: [] },
    ]) };
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(createElement(PageHeroImageFields, {
      pageKey: "payment",
      value: originalPlacement,
      onChange,
      uploadMode: "new-asset",
    }));

    await screen.findByRole("img", { name: "Фото" });
    expect(screen.queryByRole("button", { name: "Отменить замену" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.click(await screen.findByRole("button", { name: "Выбрать next.png" }));

    expect(cancelAssetReplacement).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ assetId: "asset-next" }));
  });

  it("preserves replacement management for existing shared new-asset editors", async () => {
    const cancelAssetReplacement = vi.fn().mockResolvedValue(undefined);
    mockState.client = { cancelAssetReplacement, listAssets: vi.fn().mockResolvedValue([
      { id: "asset-original", name: "old.png", mimeType: "image/png", dataUrl: "/media/old.png", usedBy: [], replacementPending: true },
      { id: "asset-next", name: "next.png", mimeType: "image/png", dataUrl: "/media/next.png", usedBy: [] },
    ]) };
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(createElement(PlacementFields, {
      label: "Иконка витрины",
      value: originalPlacement,
      onChange,
      uploadMode: "new-asset",
    }));

    await screen.findByRole("img", { name: "Фото" });
    expect(await screen.findByText("Новое фото появится на сайте после публикации.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Отменить замену" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.click(await screen.findByRole("button", { name: "Выбрать next.png" }));

    expect(cancelAssetReplacement).toHaveBeenCalledWith("asset-original");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ assetId: "asset-next" }));
  });

  it("keeps clear available for a hero placement whose media preview is missing", async () => {
    const cancelAssetReplacement = vi.fn();
    const replaceAsset = vi.fn();
    const createAsset = vi.fn();
    const onChange = vi.fn();
    mockState.client = { cancelAssetReplacement, replaceAsset, createAsset, listAssets: vi.fn().mockResolvedValue([]) };
    const user = userEvent.setup();
    render(createElement(PlacementFields, {
      value: originalPlacement,
      onChange,
      frame: PAGE_IMAGE_FRAMES.pageHero,
      pageHeroPreview: { pageKey: "payment" },
    }));

    await screen.findByRole("button", { name: "Выбрать из галереи" });
    await user.click(screen.getByRole("button", { name: "Убрать фото" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(cancelAssetReplacement).not.toHaveBeenCalled();
    expect(replaceAsset).not.toHaveBeenCalled();
    expect(createAsset).not.toHaveBeenCalled();
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

  it("keeps the existing focal control for frames without a page hero preview and leaves the product square alone", async () => {
    const css = readFileSync("src/admin/pages/pageImageFrame.module.css", "utf8");
    const productCss = readFileSync("src/admin/media/PlacementFields.module.css", "utf8");
    expect(css).toMatch(/object-fit:\s*cover/);
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


  it.each(["delivery", "about"])("uses the contract geometry for %s across devices", async (pageKey) => {
    mockState.client = { listAssets: vi.fn().mockResolvedValue([]) };
    const user = userEvent.setup();
    render(createElement(PlacementFields, {
      frame: PAGE_IMAGE_FRAMES.pageHero,
      pageHeroPreview: { pageKey },
      value: originalPlacement,
      onChange: vi.fn(),
      previewSrc: "/media/hero.png",
    }));

    const shot = screen.getByLabelText("Предпросмотр фото и точки фокуса");
    for (const [viewport, label] of [
      ["desktop", "Desktop"],
      ["tablet", "Планшет"],
      ["mobile", "Мобильный"],
    ] as const) {
      await user.click(screen.getByRole("button", { name: label }));
      const { width: viewportWidth, height: viewportHeight } = pageHeroReferenceViewport(viewport);
      const { width, height } = pageHeroPreviewGeometry({ pageKey, viewportWidth, viewportHeight });
      expect(shot.getAttribute("data-preview-viewport")).toBe(viewport);
      expect(screen.getByText(`${viewportWidth} × ${viewportHeight} px`)).toBeTruthy();
      const [ratioWidth, ratioHeight = 1] = shot.style.aspectRatio.split("/").map(Number);
      expect(ratioWidth / ratioHeight).toBeCloseTo(width / height, 8);
    }
  });

  it("moves the page hero image with a captured pointer and preserves the other device crops", async () => {
    mockState.client = { listAssets: vi.fn().mockResolvedValue([]) };
    const user = userEvent.setup();
    class TestPointerEvent extends MouseEvent {
      readonly pointerId: number;
      constructor(type: string, init: PointerEventInit) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
      }
    }
    vi.stubGlobal("PointerEvent", TestPointerEvent);

    const onChange = vi.fn();
    const initial = {
      ...originalPlacement,
      focalX: 0.5,
      focalY: 0.7,
      focalByViewport: { tablet: { x: 0.1, y: 0.2 } },
    };
    function TestEditor() {
      const [value, setValue] = useState<ImagePlacement | undefined>(initial);
      return createElement(PlacementFields, {
        frame: PAGE_IMAGE_FRAMES.pageHero,
        pageHeroPreview: { pageKey: "delivery" },
        value,
        onChange: (next) => { setValue(next); onChange(next); },
        previewSrc: "/media/hero.png",
      });
    }
    render(createElement(TestEditor));

    const image = screen.getByRole("img", { name: "Фото" });
    const drag = screen.getByRole("button", { name: "Положение изображения (desktop)" });
    const position = () => image.style.getPropertyValue("--frame-position");
    Object.defineProperties(image, {
      naturalWidth: { value: 800 },
      naturalHeight: { value: 200 },
    });
    vi.spyOn(image, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 100));
    vi.spyOn(screen.getByLabelText("Предпросмотр фото и точки фокуса"), "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 100));
    const setPointerCapture = vi.fn();
    Object.assign(drag, { setPointerCapture, hasPointerCapture: () => true });

    expect(position()).toBe("50% 70%");
    fireEvent.pointerDown(drag, { pointerId: 1, button: 0, clientX: 40, clientY: 30 });
    expect(setPointerCapture).toHaveBeenCalledWith(1);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerMove(drag, { pointerId: 2, clientX: 100, clientY: 30 });
    expect(position()).toBe("50% 70%");
    fireEvent.pointerMove(drag, { pointerId: 1, clientX: 90, clientY: 40 });
    expect(position()).toBe("25% 70%");
    fireEvent.pointerCancel(drag, { pointerId: 1 });
    fireEvent.pointerMove(drag, { pointerId: 1, clientX: 40, clientY: 30 });
    expect(position()).toBe("25% 70%");

    await user.click(screen.getByRole("button", { name: "Планшет" }));
    expect(position()).toBe("10% 20%");
    await user.click(screen.getByRole("button", { name: "Мобильный" }));
    expect(position()).toBe("50% 70%");
    const mobile = screen.getByRole("button", { name: "Положение изображения (mobile)" });
    expect(mobile.getAttribute("aria-describedby")).toBe(screen.getByText(/Перетащите изображение/).id);
    mobile.focus();
    const changeCount = onChange.mock.calls.length;
    await user.keyboard("{ArrowDown}");
    expect(position()).toBe("50% 70%");
    expect(onChange).toHaveBeenCalledTimes(changeCount);
    await user.keyboard("{ArrowRight}");
    expect(position()).toBe("49% 70%");
    await user.click(screen.getByRole("button", { name: "Desktop" }));
    expect(position()).toBe("25% 70%");
    expect(onChange.mock.lastCall?.[0].focalByViewport).toEqual({
      desktop: { x: 0.25, y: 0.7 },
      tablet: { x: 0.1, y: 0.2 },
      mobile: { x: 0.49, y: 0.7 },
    });
  });

  it("edits desktop, tablet, and mobile focal points independently without uploading media", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    mockState.client = { listAssets: vi.fn().mockResolvedValue([{ id: "asset-original", dataUrl: "/media/hero.png" }]) };
    const { rerender } = render(createElement(PlacementFields, {
      label: "Фото",
      frame: PAGE_IMAGE_FRAMES.homeHero,
      value: { ...originalPlacement, focalX: 0.2, focalY: 0.3 },
      onChange,
    }));
    const focus = await screen.findByRole("button", { name: /Точка фокуса \(desktop\)/ });
    focus.focus();
    await user.keyboard("{ArrowRight}");
    const updatedPlacement = onChange.mock.lastCall?.[0];
    if (updatedPlacement == null) throw new Error("Expected the desktop focus change to update the placement");
    expect(updatedPlacement.focalX).toBeCloseTo(0.21);
    expect(updatedPlacement.focalY).toBe(0.3);
    expect(updatedPlacement.focalByViewport).toEqual({
      desktop: { x: expect.closeTo(0.21), y: 0.3 },
      tablet: { x: 0.2, y: 0.3 },
      mobile: { x: 0.2, y: 0.3 },
    });
    rerender(createElement(PlacementFields, { label: "Фото", frame: PAGE_IMAGE_FRAMES.homeHero, value: updatedPlacement, onChange }));
    await user.click(screen.getByRole("button", { name: "Планшет" }));
    const tabletFocus = screen.getByRole("button", { name: /Точка фокуса \(tablet\)/ });
    tabletFocus.focus();
    await user.keyboard("{ArrowUp}");
    const tabletPlacement = onChange.mock.lastCall?.[0];
    if (tabletPlacement == null) throw new Error("Expected the tablet focus change to update the placement");
    expect(tabletPlacement.focalByViewport).toMatchObject({ desktop: { x: expect.closeTo(0.21), y: 0.3 }, tablet: { x: 0.2, y: expect.closeTo(0.29) }, mobile: { x: 0.2, y: 0.3 } });
    rerender(createElement(PlacementFields, { label: "Фото", frame: PAGE_IMAGE_FRAMES.homeHero, value: tabletPlacement, onChange }));
    await user.click(screen.getByRole("button", { name: "Мобильный" }));
    const mobileFocus = screen.getByRole("button", { name: /Точка фокуса \(mobile\)/ });
    mobileFocus.focus();
    await user.keyboard("{ArrowDown}");
    const mobilePlacement = onChange.mock.lastCall?.[0];
    if (mobilePlacement == null) throw new Error("Expected the mobile focus change to update the placement");
    expect(mobilePlacement.focalByViewport).toMatchObject({ desktop: { x: expect.closeTo(0.21), y: 0.3 }, tablet: { x: 0.2, y: expect.closeTo(0.29) }, mobile: { x: 0.2, y: expect.closeTo(0.31) } });
    expect(screen.getByRole("img", { name: "Фото" }).getAttribute("src")).toContain("hero.png");
    expect(mockState.client.replaceAsset).toBeUndefined();
    expect(mockState.client.createAsset).toBeUndefined();
  });
});
