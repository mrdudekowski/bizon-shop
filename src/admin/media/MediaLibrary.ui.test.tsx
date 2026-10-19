// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import { MediaLibrary } from "./MediaLibrary";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("media library usage and deletion controls", () => {
  it("shows where a used asset is referenced and disables deletion", async () => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      listAssets: vi.fn().mockResolvedValue([{ id: "asset-used", name: "hero.jpg", mimeType: "image/jpeg", dataUrl: "/media/hero.jpg", usedBy: ["Главная → Первый экран"] }]),
      listMediaDeletionHistory: vi.fn().mockResolvedValue([]),
      deleteAsset: vi.fn(),
    };
    render(createElement(MediaLibrary));

    expect(await screen.findByText("Главная → Первый экран")).toBeTruthy();
    expect(screen.getByLabelText("Файл используется")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Удалить" }).hasAttribute("disabled")).toBe(false);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await userEvent.setup().click(screen.getByRole("button", { name: "Удалить" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Файл используется в 1 месте"));
    expect(mockState.client.deleteAsset).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("confirms unlinking references before deleting a used asset", async () => {
    const user = userEvent.setup();
    const listAssets = vi.fn()
      .mockResolvedValueOnce([{ id: "asset-used", name: "hero.jpg", mimeType: "image/jpeg", dataUrl: "/media/hero.jpg", usedBy: ["Главная → Первый экран"] }])
      .mockResolvedValueOnce([]);
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      listAssets,
      listMediaDeletionHistory: vi.fn().mockResolvedValue([]),
      deleteAsset: vi.fn().mockResolvedValue(undefined),
    };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(createElement(MediaLibrary));

    await user.click(await screen.findByRole("button", { name: "Удалить" }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("При удалении он будет отвязан от всех этих мест."));
    expect(mockState.client.deleteAsset).toHaveBeenCalledWith("asset-used");
    expect(await screen.findByText("Загруженных файлов пока нет.")).toBeTruthy();
  });

  it("asks before deleting an unused asset and refreshes the library", async () => {
    const user = userEvent.setup();
    const asset = { id: "asset-free", name: "unused.jpg", mimeType: "image/jpeg", dataUrl: "/media/unused.jpg", usedBy: [] };
    const listAssets = vi.fn().mockResolvedValue([asset]);
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      listAssets,
      listMediaDeletionHistory: vi.fn().mockResolvedValue([]),
      deleteAsset: vi.fn().mockResolvedValue(undefined),
    };
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(createElement(MediaLibrary));

    await user.click(await screen.findByRole("button", { name: "Удалить" }));

    expect(confirm).toHaveBeenCalledWith("Удалить файл «unused.jpg» из хранилища?\nЭто действие нельзя отменить.");
    expect(mockState.client.deleteAsset).toHaveBeenCalledWith("asset-free");
    expect(listAssets).toHaveBeenCalledTimes(2);
    confirm.mockRestore();
  });
});
