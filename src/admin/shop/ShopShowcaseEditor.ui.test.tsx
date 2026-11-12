// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import { ShopShowcaseEditor } from "./ShopShowcaseEditor";

const pageDraft = {
  id: "shop-home",
  seoTitle: "Shop",
  seoDescription: "",
  hero: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" } },
  wheelsIntro: { eyebrow: "", title: "", lead: "", kicker: "" },
  homeCarousel: { diskCaption: "Кованые диски, созданные под ваш автомобиль" },
  orderSteps: [],
  categoryCarousel: [],
  catalog: { copy: { eyebrow: "", title: "", lead: "", sectionTitle: "" }, tiles: [] },
  vehicles: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" }, slides: [] },
};
const pageRecord = {
  id: "shop-home",
  draft: pageDraft,
  savedDraft: pageDraft,
  publishedSnapshot: pageDraft,
  hidden: false,
  slugLocked: false,
  lastSavedBy: null,
  lastPublishedBy: null,
};
const category = {
  id: "category-1",
  draft: { id: "category-1", name: "Шины", slug: "tires", description: "", sortOrder: 1, showInMenu: true, mainImage: { assetId: "category-icon" }, carousel: [] },
  savedDraft: null,
  publishedSnapshot: null,
  hidden: false,
  slugLocked: false,
  lastSavedBy: null,
  lastPublishedBy: null,
};

afterEach(cleanup);

describe("Shop showcase editor", () => {
  beforeEach(() => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: ["edit_site_pages"] }),
      listAssets: vi.fn().mockResolvedValue([]),
      getPage: vi.fn().mockResolvedValue(pageRecord),
      listShopCategories: vi.fn().mockResolvedValue([category]),
      listChangeSets: vi.fn().mockResolvedValue([]),
      savePage: vi.fn().mockImplementation(async (_key: string, draft: typeof pageDraft) => ({ ...pageRecord, draft, savedDraft: draft })),
    };
  });

  it("shows carousel controls, saves their values on the Shop page draft, and offers submit for approval", async () => {
    const user = userEvent.setup();
    render(createElement(ShopShowcaseEditor));

    expect(await screen.findByRole("heading", { name: "Карусель категорий на главной" })).toBeTruthy();
    const carouselVisibility = screen.getByRole("checkbox", { name: /Показывать в карусели/i });
    await user.click(carouselVisibility);
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mockState.client.savePage).toHaveBeenCalledWith("shop-home", expect.objectContaining({
      catalog: expect.objectContaining({
        tiles: [expect.objectContaining({ categoryId: "category-1", carouselVisible: true })],
      }),
    }));
    expect(await screen.findByRole("button", { name: "Отправить на одобрение" })).toBeTruthy();
  });

  it("does not treat category-derived tiles as unsaved edits on initial load", async () => {
    const { container } = render(createElement(ShopShowcaseEditor));

    expect(await screen.findByRole("heading", { name: "Карусель категорий на главной" })).toBeTruthy();
    expect(container.querySelector("[data-unsaved='true']")).toBeNull();
    expect(mockState.client.savePage).not.toHaveBeenCalled();
  });

  it("shows category tile and catalog copy controls in their own tabs", async () => {
    const user = userEvent.setup();
    render(createElement(ShopShowcaseEditor));

    await user.click(await screen.findByRole("tab", { name: "Плитки категорий" }));
    expect(screen.getByLabelText(/Название плитки/i)).toBeTruthy();
    expect(screen.getByLabelText(/Показывать на сайте/i)).toBeTruthy();
    expect(screen.getByText("Иконка")).toBeTruthy();
    expect(screen.queryByText("Изображение плитки")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(mockState.client.savePage).toHaveBeenCalledWith("shop-home", expect.objectContaining({
      catalog: expect.objectContaining({
        tiles: [expect.objectContaining({ categoryId: "category-1", icon: expect.objectContaining({ assetId: "category-icon" }) })],
      }),
    }));
    expect(mockState.client.savePage.mock.calls[0][1].catalog.tiles[0]).not.toHaveProperty("image");
    await user.click(screen.getByRole("tab", { name: "Страница каталога" }));
    expect(screen.getByLabelText("Заголовок списка категорий")).toBeTruthy();
  });

  it("saves disk and category homepage carousel captions from the tiles panel", async () => {
    const user = userEvent.setup();
    const seededPage = {
      ...pageRecord,
      draft: {
        ...pageDraft,
        homeCarousel: { diskCaption: "Кованые диски, созданные под ваш автомобиль" },
        catalog: {
          ...pageDraft.catalog,
          tiles: [{ categoryId: "category-1", title: "Кемпинг и путешествия", visible: true, sortOrder: 1, carouselVisible: false, homeCarouselCaption: "Старый текст", icon: { assetId: "old-icon" } }],
        },
      },
      savedDraft: undefined,
    };
    mockState.client.getPage = vi.fn().mockResolvedValue(seededPage);
    render(createElement(ShopShowcaseEditor));

    await user.click(await screen.findByRole("tab", { name: "Плитки категорий" }));
    const diskCaption = screen.getByRole("textbox", { name: "Подпись для карусели главной — Диски" });
    const categoryCaption = screen.getByRole("textbox", { name: "Подпись карусели: Кемпинг и путешествия" });
    await user.clear(diskCaption);
    await user.type(diskCaption, "Диски BIZON");
    await user.clear(categoryCaption);
    await user.type(categoryCaption, "Поездки и отдых");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mockState.client.savePage).toHaveBeenCalledWith("shop-home", expect.objectContaining({
      homeCarousel: { diskCaption: "Диски BIZON" },
      catalog: expect.objectContaining({
        tiles: [expect.objectContaining({ homeCarouselCaption: "Поездки и отдых" })],
      }),
    }));
  });
});
