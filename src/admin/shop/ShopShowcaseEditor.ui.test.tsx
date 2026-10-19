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
  draft: { id: "category-1", name: "Шины", slug: "tires", description: "", sortOrder: 1, showInMenu: true, carousel: [] },
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

  it("shows category tile and catalog copy controls in their own tabs", async () => {
    const user = userEvent.setup();
    render(createElement(ShopShowcaseEditor));

    await user.click(await screen.findByRole("tab", { name: "Плитки категорий" }));
    expect(screen.getByLabelText(/Название плитки/i)).toBeTruthy();
    expect(screen.getByLabelText(/Показывать на сайте/i)).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Страница каталога" }));
    expect(screen.getByLabelText("Заголовок списка категорий")).toBeTruthy();
  });
});
