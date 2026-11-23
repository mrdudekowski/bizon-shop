// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ImagePlacement } from "@/admin/domain/types";
import { PageHeroImageFields } from "./PageHeroImageFields";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

const asset = { id: "asset-hero", name: "hero.png", mimeType: "image/png", dataUrl: "/media/hero.png", usedBy: [] };
const placement: ImagePlacement = {
  assetId: asset.id,
  alt: "Грузовой автомобиль",
  focalX: 0.5,
  focalY: 0.7,
  focalByViewport: { tablet: { x: 0.1, y: 0.2 } },
  crop: { x: 0, y: 0, width: 1, height: 1 },
};

function renderField(initial?: ImagePlacement | null, uploadMode?: "replace" | "new-asset") {
  const onChange = vi.fn();
  function ControlledField() {
    const [value, setValue] = useState(initial);
    return createElement(PageHeroImageFields, {
      pageKey: "delivery",
      uploadMode,
      value,
      onChange: (next) => { onChange(next); setValue(next); },
    });
  }
  render(createElement(ControlledField));
  return onChange;
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  mockState.client = {
    listAssets: vi.fn().mockResolvedValue([asset]),
    createAsset: vi.fn(),
    replaceAsset: vi.fn(),
    cancelAssetReplacement: vi.fn(),
    deleteAsset: vi.fn(),
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PageHeroImageFields", () => {
  it("starts with an empty slot and previews a library selection", async () => {
    const onChange = renderField(null);
    const user = userEvent.setup();
    const field = screen.getByRole("group", { name: "Изображение шапки" });
    expect(within(field).queryByRole("img")).toBeNull();
    await user.click(within(field).getByRole("button", { name: "Выбрать из галереи" }));
    await user.click(await screen.findByRole("button", { name: /hero\.png/ }));

    expect(await within(field).findByRole("img", { name: "Изображение шапки" })).toHaveProperty("src", expect.stringContaining(asset.dataUrl));
    expect(onChange).toHaveBeenCalledWith({
      assetId: asset.id, alt: "", focalX: 0.5, focalY: 0.5, crop: { x: 0, y: 0, width: 1, height: 1 },
    });
    expect(mockState.client.createAsset).not.toHaveBeenCalled();
  });

  it("uploads an image to the library and selects it in the empty slot", async () => {
    const uploaded = { ...asset, id: "asset-uploaded", name: "new.png", dataUrl: "/media/new.png" };
    mockState.client.listAssets.mockResolvedValueOnce([]).mockResolvedValue([uploaded]);
    mockState.client.createAsset.mockResolvedValue({ id: uploaded.id });
    const onChange = renderField();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.upload(await screen.findByLabelText("Файл для библиотеки"), new File(["image"], uploaded.name, { type: "image/png" }));

    expect(await screen.findByRole("img", { name: "Изображение шапки" })).toHaveProperty("src", expect.stringContaining(uploaded.dataUrl));
    expect(mockState.client.createAsset).toHaveBeenCalledWith(expect.objectContaining({
      name: uploaded.name, mimeType: "image/png",
    }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ assetId: uploaded.id }));
    expect(mockState.client.replaceAsset).not.toHaveBeenCalled();
  });

  it.each(["replace", "new-asset"] as const)("preserves placement metadata when using %s upload for an occupied slot", async (uploadMode) => {
    const nativeURL = URL;
    vi.stubGlobal("URL", class extends nativeURL {
      static createObjectURL = vi.fn(() => "blob:hero-preview");
      static revokeObjectURL = vi.fn();
    });
    const uploaded = { ...asset, id: "asset-uploaded", name: "new.png", dataUrl: "/media/new.png" };
    mockState.client.listAssets.mockResolvedValue([asset, uploaded]);
    mockState.client.createAsset.mockResolvedValue({ id: uploaded.id });
    mockState.client.replaceAsset.mockResolvedValue({ id: asset.id, replacementAssetId: "asset-replacement" });
    const onChange = renderField(placement, uploadMode);
    const user = userEvent.setup();
    await screen.findByRole("img", { name: placement.alt });
    await user.upload(
      screen.getByLabelText("Изображение шапки: файл"),
      new File(["image"], uploaded.name, { type: "image/png" }),
    );

    const upload = expect.objectContaining({ name: uploaded.name, mimeType: "image/png" });
    if (uploadMode === "new-asset") {
      await waitFor(() => expect(onChange).toHaveBeenCalledExactlyOnceWith({ ...placement, assetId: uploaded.id }));
      expect(mockState.client.createAsset).toHaveBeenCalledExactlyOnceWith(upload);
      expect(mockState.client.replaceAsset).not.toHaveBeenCalled();
    } else {
      expect(await screen.findByText("Новое фото появится на сайте после публикации.")).toBeTruthy();
      expect(mockState.client.replaceAsset).toHaveBeenCalledExactlyOnceWith(asset.id, upload);
      expect(mockState.client.createAsset).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledExactlyOnceWith({ ...placement, replacementAssetId: "asset-replacement" });
    }
  });

  it("edits alt text and moves the selected image independently by device", async () => {
    const onChange = renderField(placement);
    const user = userEvent.setup();
    const image = await screen.findByRole("img", { name: placement.alt });
    const shot = screen.getByLabelText("Предпросмотр фото и точки фокуса");
    const position = () => image.style.getPropertyValue("--frame-position");
    expect(shot.getAttribute("data-page-hero-preview")).toBe("banner");
    expect(position()).toBe("50% 70%");

    const alt = screen.getByRole("textbox", { name: "Подпись к фото" });
    await user.type(alt, " BIZON");
    expect(image).toHaveProperty("alt", `${placement.alt} BIZON`);

    await user.click(screen.getByRole("button", { name: "Планшет" }));
    expect(position()).toBe("10% 20%");
    await user.click(screen.getByRole("button", { name: "Мобильный" }));
    expect(position()).toBe("50% 70%");
    const drag = screen.getByRole("button", { name: "Положение изображения (mobile)" });
    Object.defineProperties(image, {
      naturalWidth: { value: 800 },
      naturalHeight: { value: 200 },
    });
    vi.spyOn(image, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 200, 100));
    const setPointerCapture = vi.fn();
    Object.assign(drag, { setPointerCapture, hasPointerCapture: () => true });
    fireEvent(drag, Object.assign(new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 40 }), { pointerId: 1 }));
    fireEvent(drag, Object.assign(new MouseEvent("pointermove", { bubbles: true, clientX: 90 }), { pointerId: 1 }));

    expect(setPointerCapture).toHaveBeenCalledExactlyOnceWith(1);
    expect(position()).toBe("25% 70%");
    expect(onChange).toHaveBeenLastCalledWith({
      ...placement,
      alt: `${placement.alt} BIZON`,
      focalByViewport: {
        desktop: { x: 0.5, y: 0.7 },
        tablet: { x: 0.1, y: 0.2 },
        mobile: { x: 0.25, y: 0.7 },
      },
    });
    await user.click(screen.getByRole("button", { name: "Desktop" }));
    expect(position()).toBe("50% 70%");
  });

  it("clears only the placement, including when the library asset has a pending replacement", async () => {
    mockState.client.listAssets.mockResolvedValue([{ ...asset, replacementPending: true }]);
    const onChange = renderField({ ...placement, replacementAssetId: "asset-replacement" });
    const user = userEvent.setup();
    await screen.findByRole("img", { name: placement.alt });
    await user.click(screen.getByRole("button", { name: "Убрать фото" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Выбрать из галереи" })).toBeTruthy();
    expect(mockState.client.deleteAsset).not.toHaveBeenCalled();
    expect(mockState.client.replaceAsset).not.toHaveBeenCalled();
    expect(mockState.client.cancelAssetReplacement).not.toHaveBeenCalled();
    expect(mockState.client.createAsset).not.toHaveBeenCalled();
  });
});
