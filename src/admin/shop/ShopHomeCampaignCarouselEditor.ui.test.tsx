// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));
vi.mock("@/admin/ui/DocumentReviewFooter", () => ({
  DocumentReviewFooter: ({ onSave, adminActions, message }: { onSave: () => Promise<void>; adminActions: React.ReactNode; message?: string }) => (
    <footer>
      {message ? <p role="status">{message}</p> : null}
      <button type="button" onClick={() => void onSave()}>Сохранить карусель</button>
      {adminActions}
    </footer>
  ),
}));

import { ShopHomeCampaignCarouselEditor } from "./ShopHomeCampaignCarouselEditor";

const pageDraft = {
  id: "shop-home",
  seoTitle: "Shop",
  seoDescription: "",
  hero: { eyebrow: "", title: "", lead: "", cta: { label: "", href: "" } },
  wheelsIntro: { eyebrow: "", title: "", lead: "", kicker: "" },
  homeCarousel: { diskCaption: "Диски для поездок" },
  orderSteps: [],
  categoryCarousel: [],
  catalog: { copy: { eyebrow: "", title: "", lead: "", sectionTitle: "" }, tiles: [
    { categoryId: "tires", title: "Шины", visible: true, sortOrder: 1, carouselVisible: true, homeCarouselCaption: "Для любых дорог", icon: { assetId: "shop-tire-icon" } },
  ] },
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
const tiresCategory = {
  id: "tires",
  draft: { id: "tires", name: "Шины", slug: "tires", description: "", sortOrder: 1, showInMenu: true, mainImage: { assetId: "category-tire-icon" }, carousel: [] },
  savedDraft: null,
  publishedSnapshot: null,
  hidden: false,
  slugLocked: false,
  lastSavedBy: null,
  lastPublishedBy: null,
};
const newCategory = {
  ...tiresCategory,
  id: "camping",
  draft: { ...tiresCategory.draft, id: "camping", name: "Путешествия", slug: "camping", sortOrder: 2, mainImage: undefined },
};

afterEach(cleanup);

describe("Shop home campaign carousel editor", () => {
  beforeEach(() => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "admin", capabilities: ["edit_site_pages"] }),
      getPage: vi.fn().mockResolvedValue(pageRecord),
      listShopCategories: vi.fn().mockResolvedValue([tiresCategory, newCategory]),
      listAssets: vi.fn().mockResolvedValue([
        { id: "shop-tire-icon", name: "tire.png", mimeType: "image/png", dataUrl: "/media/shop-tire-icon.png" },
        { id: "category-tire-icon", name: "category.png", mimeType: "image/png", dataUrl: "/media/category-tire-icon.png" },
      ]),
      listChangeSets: vi.fn().mockResolvedValue([]),
      savePage: vi.fn().mockImplementation(async (_key: string, draft: typeof pageDraft) => ({ ...pageRecord, draft, savedDraft: draft })),
      publishPage: vi.fn().mockResolvedValue(pageRecord),
    };
  });

  it("shows the disk caption, category captions, resolved icons, and a blank row for a new category", async () => {
    render(createElement(ShopHomeCampaignCarouselEditor));

    expect(await screen.findByRole("textbox", { name: "Подпись для карусели — Диски" })).toHaveProperty("value", "Диски для поездок");
    expect(screen.getByRole("textbox", { name: "Подпись карусели: Шины" })).toHaveProperty("value", "Для любых дорог");
    expect(screen.getByRole("img", { name: "Иконка категории Шины" })).toHaveProperty("src", "http://localhost:3000/media/shop-tire-icon.png");
    expect(screen.getByRole("textbox", { name: "Подпись карусели: Путешествия" })).toHaveProperty("value", "");
    expect(screen.getByText("Нет иконки")).toBeTruthy();
  });

  it("keeps the disk caption editable and shows an empty state when there are no categories", async () => {
    mockState.client.listShopCategories = vi.fn().mockResolvedValue([]);
    render(createElement(ShopHomeCampaignCarouselEditor));

    expect(await screen.findByRole("textbox", { name: "Подпись для карусели — Диски" })).toHaveProperty("value", "Диски для поездок");
    expect(screen.getByText("Категорий пока нет. Добавьте их в разделе Shop — категории." )).toBeTruthy();
  });

  it("reports load errors", async () => {
    mockState.client.listAssets = vi.fn().mockRejectedValue(new Error("asset service failed"));
    render(createElement(ShopHomeCampaignCarouselEditor));

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось загрузить настройки карусели Shop.");
  });

  it("saves and publishes Shop home captions through shop-home actions", async () => {
    const user = userEvent.setup();
    render(createElement(ShopHomeCampaignCarouselEditor));

    const diskCaption = await screen.findByRole("textbox", { name: "Подпись для карусели — Диски" });
    await user.clear(diskCaption);
    await user.type(diskCaption, "Диски Bizon");
    await user.click(screen.getByRole("button", { name: "Сохранить карусель" }));
    expect(mockState.client.savePage).toHaveBeenCalledWith("shop-home", expect.objectContaining({
      homeCarousel: { diskCaption: "Диски Bizon" },
      catalog: expect.objectContaining({ tiles: expect.arrayContaining([expect.objectContaining({ categoryId: "tires", homeCarouselCaption: "Для любых дорог" })]) }),
    }));

    await user.click(screen.getByRole("button", { name: "Опубликовать" }));
    expect(mockState.client.publishPage).toHaveBeenCalledWith("shop-home");
  });

  it("shows save errors without discarding edited captions", async () => {
    mockState.client.savePage = vi.fn().mockRejectedValue(new Error("save failed"));
    const user = userEvent.setup();
    render(createElement(ShopHomeCampaignCarouselEditor));

    const caption = await screen.findByRole("textbox", { name: "Подпись карусели: Шины" });
    await user.clear(caption);
    await user.type(caption, "Новый текст");
    await user.click(screen.getByRole("button", { name: "Сохранить карусель" }));

    expect((await screen.findByRole("status")).textContent).toContain("Не удалось сохранить");
    expect(caption).toHaveProperty("value", "Новый текст");
  });
});
