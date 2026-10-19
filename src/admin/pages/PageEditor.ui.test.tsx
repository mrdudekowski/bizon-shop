// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import { AdminClientError } from "@/admin/client/errors";
import { PageEditor } from "./PageEditor";

const draft = {
  id: "about",
  seoTitle: "Исходный заголовок",
  seoDescription: "Описание",
  hero: { eyebrow: "", title: "О нас", lead: "" },
  documents: [],
};
const pageRecord = {
  id: "about",
  draft,
  savedDraft: draft,
  publishedSnapshot: draft,
  hidden: false,
  slugLocked: false,
  lastSavedBy: "editor",
  lastPublishedBy: "admin",
};
const shopHomeDraft = {
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

afterEach(cleanup);

describe("PageEditor conflict recovery", () => {
  beforeEach(() => {
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: ["edit_site_pages"] }),
      getPage: vi.fn().mockResolvedValue(pageRecord),
      listChangeSets: vi.fn().mockResolvedValue([]),
      savePage: vi.fn().mockRejectedValue(new AdminClientError("conflict")),
    };
  });

  it("keeps the editor's text visible and reports conflict after a stale save", async () => {
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "about" }));

    const title = await screen.findByLabelText("Заголовок страницы в поиске");
    await user.clear(title);
    await user.type(title, "Изменённый текст во второй вкладке");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText(/уже изменили в другой вкладке/i)).toBeTruthy();
    expect(title).toHaveProperty("value", "Изменённый текст во второй вкладке");
  });

  it("lets an editor save and submit a change set without direct publish controls", async () => {
    const changeSet = {
      id: "change-1",
      authorUserId: "editor-id",
      authorLogin: "editor",
      status: "open",
      submittedAt: null as string | null,
      entries: [{ entityType: "page", entityId: "about", fieldChanges: [{ path: "seoTitle" }] }],
    };
    mockState.client.savePage = vi.fn().mockImplementation(async (_key: string, next: typeof draft) => ({ ...pageRecord, draft: next, savedDraft: next }));
    mockState.client.listChangeSets = vi.fn().mockImplementation(async () => [changeSet]);
    mockState.client.submitChangeSet = vi.fn().mockImplementation(async () => {
      changeSet.status = "pending_review";
      changeSet.submittedAt = "2026-10-08T00:00:00.000Z";
      return changeSet;
    });
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "about" }));

    const title = await screen.findByLabelText("Заголовок страницы в поиске");
    await user.clear(title);
    await user.type(title, "Черновик редактора");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));
    const submit = await screen.findByRole("button", { name: "Отправить на одобрение" });
    expect(screen.queryByRole("button", { name: "Опубликовать" })).toBeNull();
    await user.click(submit);

    expect(await screen.findByText(/Отправлено на одобрение/i)).toBeTruthy();
    expect(mockState.client.submitChangeSet).toHaveBeenCalledWith("change-1");
  });

  it("keeps the carousel editor out of the general Shop page editor", async () => {
    const shopRecord = { ...pageRecord, id: "shop-home", draft: shopHomeDraft, savedDraft: shopHomeDraft, publishedSnapshot: shopHomeDraft };
    mockState.client.getPage = vi.fn().mockResolvedValue(shopRecord);
    render(createElement(PageEditor, { pageKey: "shop-home" }));

    expect(await screen.findByRole("heading", { name: "Магазин" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Карусель главной" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Карусель категорий на главной" })).toBeNull();
  });

  it("shows a PDF upload failure beside the document control", async () => {
    const legalDraft = { id: "privacy-policy", seoTitle: "Политика", seoDescription: "", hero: { eyebrow: "", title: "", lead: "" }, documents: [] };
    mockState.client.getPage = vi.fn().mockResolvedValue({ ...pageRecord, id: "privacy-policy", draft: legalDraft, savedDraft: legalDraft, publishedSnapshot: legalDraft });
    mockState.client.createAsset = vi.fn().mockRejectedValue(new Error("storage offline"));
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "privacy-policy" }));

    await user.upload(await screen.findByLabelText("PDF"), new File(["pdf"], "policy.pdf", { type: "application/pdf" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось загрузить файл");
  });
});
