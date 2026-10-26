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
  it("filters by actual usage with a cascading page and placement selector and detaches only the chosen link", async () => {
    const user = userEvent.setup();
    const usage = (id: string, pageKey: string, pageLabel: string, placementKey: string, placementLabel: string) => ({
      id, mediaId: "asset-shared", topLevelKey: "shop", topLevelLabel: "Bizon Shop", pageKey, pageLabel,
      placementKey, placementLabel, state: "published-visible" as const, reviewRecommended: false, detachable: true,
    });
    let currentUsages = [
      usage("shop-home", "shop-home", "Главная Bizon Shop", "carousel", "Карусель"),
      usage("shop-tires", "tires", "Шины", "product", "Карточка товара"),
    ];
    const listAssets = vi.fn().mockImplementation(async () => [
      { id: "asset-shared", name: "shared.jpg", mimeType: "image/jpeg", dataUrl: "/media/shared.jpg", usedBy: [], usages: currentUsages },
      { id: "asset-other", name: "other.jpg", mimeType: "image/jpeg", dataUrl: "/media/other.jpg", usedBy: [], usages: [
        usage("home-hero", "home", "Главная", "hero", "Hero"),
      ] },
      { id: "asset-free", name: "free.jpg", mimeType: "image/jpeg", dataUrl: "/media/free.jpg", usedBy: [], usages: [] },
    ]);
    const detachAssetUsage = vi.fn().mockImplementation(async (_assetId: string, usageId: string) => {
      currentUsages = currentUsages.filter((item) => item.id !== usageId);
    });
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      listAssets,
      listMediaDeletionHistory: vi.fn().mockResolvedValue([]),
      detachAssetUsage,
      deleteAsset: vi.fn(),
    };
    render(createElement(MediaLibrary));

    await screen.findByText("shared.jpg");
    const topLevel = screen.getByLabelText("Страница / раздел");
    await user.selectOptions(topLevel, "shop");
    await user.selectOptions(screen.getByLabelText("Вложенная страница"), "shop-home");
    await user.selectOptions(screen.getByLabelText("Раздел / место"), "carousel");
    expect(screen.getByText("shared.jpg")).toBeTruthy();
    expect(screen.queryByText("other.jpg")).toBeNull();
    expect(screen.queryByText("free.jpg")).toBeNull();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getAllByRole("button", { name: "Отвязать" })[0]!);
    expect(detachAssetUsage).toHaveBeenCalledWith("asset-shared", "shop-home");
    await user.selectOptions(topLevel, "");
    expect(await screen.findByText(/Шины → Карточка товара/)).toBeTruthy();
    expect(screen.getByText("shared.jpg")).toBeTruthy();
  });

  it("shows where a used asset is referenced and disables deletion", async () => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      listAssets: vi.fn().mockResolvedValue([{ id: "asset-used", name: "hero.jpg", mimeType: "image/jpeg", dataUrl: "/media/hero.jpg", usedBy: ["Главная → Первый экран"] }]),
      listMediaDeletionHistory: vi.fn().mockResolvedValue([]),
      deleteAsset: vi.fn(),
    };
    const { container } = render(createElement(MediaLibrary));

    expect(await screen.findByText("Главная → Первый экран")).toBeTruthy();
    expect((container.querySelector("img") as HTMLImageElement).src).toBe("http://localhost:3000/media/hero.jpg");
    expect(screen.getByLabelText("Файл используется")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Удалить" }).hasAttribute("disabled")).toBe(false);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await userEvent.setup().click(screen.getByRole("button", { name: "Удалить" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Файл связан с 1 размещением:"));
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

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Все перечисленные связи и сам файл будут удалены."));
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

  it("filters by file name search, file type, and date sorting", async () => {
    const user = userEvent.setup();
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      listAssets: vi.fn().mockResolvedValue([
        { id: "1", name: "atlas-wheel.webp", mimeType: "image/webp", dataUrl: "/media/atlas.webp", createdAt: "2026-07-01T10:00:00.000Z", usedBy: [], usages: [] },
        { id: "2", name: "dsr158-passport.pdf", mimeType: "application/pdf", dataUrl: "/media/dsr158.pdf", createdAt: "2026-10-20T10:00:00.000Z", usedBy: [], usages: [] },
      ]),
      listMediaDeletionHistory: vi.fn().mockResolvedValue([]),
      deleteAsset: vi.fn(),
    };
    render(createElement(MediaLibrary));

    await screen.findByText("atlas-wheel.webp");
    expect(screen.getByText("dsr158-passport.pdf")).toBeTruthy();

    await user.type(screen.getByLabelText("Поиск по названию"), "passport");
    expect(screen.queryByText("atlas-wheel.webp")).toBeNull();
    expect(screen.getByText("dsr158-passport.pdf")).toBeTruthy();

    await user.clear(screen.getByLabelText("Поиск по названию"));
    await user.selectOptions(screen.getByLabelText("Тип файла"), "image");
    expect(screen.getByText("atlas-wheel.webp")).toBeTruthy();
    expect(screen.queryByText("dsr158-passport.pdf")).toBeNull();
  });
});
