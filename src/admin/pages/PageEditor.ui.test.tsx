// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
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
const homeDraft = {
  id: "home",
  seoTitle: "Главная",
  seoDescription: "",
  hero: { eyebrow: "", title: "Шины", lead: "", image: null, primaryCta: { label: "", href: "" }, secondaryCta: { label: "", href: "" }, metricLabel: "", metricText: "" },
  directions: { eyebrow: "", title: "", lead: "" },
  expertise: { eyebrow: "Практика", title: "Экспертиза", lead: "Поддержка", image: null, cta: { label: "Изучить материалы", href: "/tire-iq" } },
  branding: { eyebrow: "", title: "Брендирование", lead: "", cta: { label: "Обсудить", href: "/contact" }, beforeCaption: "До", afterCaption: "После", beforeImage: null, afterImage: null },
  shopCampaign: { eyebrow: "", title: "", lead: "", image: null, cta: { label: "", href: "" } },
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PageEditor conflict recovery", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });
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

  it("edits and saves structured editorial sections for a stub page", async () => {
    const savePage = vi.fn().mockImplementation(async (_key: string, next: typeof draft) => ({ ...pageRecord, draft: next, savedDraft: next }));
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "about" }));

    await user.click(await screen.findByRole("button", { name: "Добавить раздел" }));
    await user.type(screen.getByLabelText("Заголовок раздела"), "Содержание из CMS");
    await user.type(screen.getByLabelText("Текст раздела"), "Текст после публикации");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByRole("status")).toBeTruthy();
    expect(savePage).toHaveBeenCalledWith("about", expect.objectContaining({
      sections: [expect.objectContaining({ heading: "Содержание из CMS", body: "Текст после публикации" })],
    }));
  });

  it("refuses to save a section that has no heading", async () => {
    const savePage = vi.fn();
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "about" }));

    await user.click(await screen.findByRole("button", { name: "Добавить раздел" }));

    expect(screen.getByRole("button", { name: "Без заголовка" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Сохранить" })).toHaveProperty("disabled", true);
    expect(savePage).not.toHaveBeenCalled();
  });

  it("exposes and saves the existing Expertise media and CTA placements", async () => {
    const record = { ...pageRecord, id: "home", draft: homeDraft, savedDraft: homeDraft, publishedSnapshot: homeDraft };
    const savePage = vi.fn().mockResolvedValue(record);
    mockState.client.listAssets = vi.fn().mockResolvedValue([
      { id: "expertise-asset", name: "expertise.jpg", mimeType: "image/jpeg", dataUrl: "/media/expertise.jpg", usedBy: [] },
    ]);
    mockState.client.getPage = vi.fn().mockResolvedValue(record);
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "home" }));
    await user.click(await screen.findByRole("tab", { name: "Экспертиза" }));

    expect(await screen.findByLabelText("Изображение экспертизы: файл")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Выбрать из галереи" }));
    await user.click(await screen.findByRole("button", { name: "Выбрать expertise.jpg" }));
    const expertiseCta = screen.getByRole("group", { name: "Кнопка экспертизы" });
    const ctaLabel = within(expertiseCta).getByLabelText("Текст");
    await user.clear(ctaLabel);
    await user.type(ctaLabel, "Читать материалы");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect((await screen.findByRole("status")).textContent).toBe("Черновик сохранён");
    expect(savePage).toHaveBeenCalledWith("home", expect.objectContaining({
      expertise: expect.objectContaining({
        image: expect.objectContaining({ assetId: "expertise-asset" }),
        cta: { label: "Читать материалы", href: "/tire-iq" },
      }),
    }));
  });

  it("exposes and saves homepage branding copy, both gallery images, captions, and CTA", async () => {
    const record = { ...pageRecord, id: "home", draft: homeDraft, savedDraft: homeDraft, publishedSnapshot: homeDraft };
    const savePage = vi.fn().mockResolvedValue(record);
    mockState.client.listAssets = vi.fn().mockResolvedValue([
      { id: "branding-before", name: "before.jpg", mimeType: "image/jpeg", dataUrl: "/media/before.jpg", usedBy: [] },
      { id: "branding-after", name: "after.jpg", mimeType: "image/jpeg", dataUrl: "/media/after.jpg", usedBy: [] },
    ]);
    mockState.client.getPage = vi.fn().mockResolvedValue(record);
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "home" }));
    await user.click(await screen.findByRole("tab", { name: "Брендинг" }));

    await user.click(screen.getAllByRole("button", { name: "Выбрать из галереи" })[0]);
    await user.click(await screen.findByRole("button", { name: "Выбрать before.jpg" }));
    const afterPlacement = screen.getByLabelText("Фото после брендирования: файл");
    expect(afterPlacement).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Выбрать из галереи" })[1]);
    await user.click(await screen.findByRole("button", { name: "Выбрать after.jpg" }));
    const cta = screen.getByRole("group", { name: "Кнопка брендирования" });
    await user.clear(within(cta).getByLabelText("Текст"));
    await user.type(within(cta).getByLabelText("Текст"), "Запросить расчёт");
    await user.clear(screen.getByLabelText("Подпись сравнения до"));
    await user.type(screen.getByLabelText("Подпись сравнения до"), "Без нанесения");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect((await screen.findByRole("status")).textContent).toBe("Черновик сохранён");
    expect(savePage).toHaveBeenCalledWith("home", expect.objectContaining({
      branding: expect.objectContaining({
        beforeImage: expect.objectContaining({ assetId: "branding-before" }),
        afterImage: expect.objectContaining({ assetId: "branding-after" }),
        cta: { label: "Запросить расчёт", href: "/contact" },
        beforeCaption: "Без нанесения",
      }),
    }));
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
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "shop-home" }));

    expect(await screen.findByRole("heading", { name: "Магазин" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Ввод дисков" }));
    const wheelsIntro = screen.getByRole("heading", { name: "Ввод дисков" }).closest("section");
    expect(wheelsIntro?.textContent).not.toContain("Лид");
    expect(screen.queryByRole("heading", { name: "Карусель главной" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Карусель категорий на главной" })).toBeNull();
  });

  it("edits the contact profile: address label, channel toggle, removal, and a custom channel", async () => {
    const contactDraft = {
      id: "contact",
      seoTitle: "Контакты",
      seoDescription: "",
      hero: { eyebrow: "", title: "", lead: "" },
      documents: [],
      siteProfile: {
        phone: "+7 (421) 200-00-00",
        email: "sales@bizon.ru",
        address: "Хабаровск",
        legalSummary: "Юридические реквизиты будут предоставлены позже.",
        requisites: [
          { id: "inn", label: "ИНН", value: "Информация будет предоставлена позже." },
        ],
        channels: [
          { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
          { id: "vk", label: "VK", href: "https://vk.com/bizon", enabled: true },
        ],
      },
    };
    const record = { ...pageRecord, id: "contact", draft: contactDraft, savedDraft: contactDraft, publishedSnapshot: contactDraft };
    const savePage = vi.fn().mockImplementation(async (_key: string, next: typeof contactDraft) => ({ ...record, draft: next, savedDraft: next }));
    mockState.client.getPage = vi.fn().mockResolvedValue(record);
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "contact" }));

    expect(await screen.findByLabelText("Адрес")).toHaveProperty("value", "Хабаровск");
    await user.click(within(screen.getByRole("group", { name: "Telegram" })).getByRole("button", { name: "Удалить канал" }));
    await user.click(within(screen.getByRole("group", { name: "VK" })).getByRole("checkbox", { name: "Показывать" }));
    await user.click(screen.getByRole("button", { name: "Добавить канал" }));
    const created = screen.getByRole("group", { name: "Новый канал" });
    await user.type(within(created).getByLabelText("Название"), "Дзен");
    await user.type(within(created).getByLabelText("Ссылка"), "https://dzen.ru/bizon");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect((await screen.findByRole("status")).textContent).toBe("Черновик сохранён");
    expect(savePage).toHaveBeenCalledWith("contact", expect.objectContaining({
      siteProfile: expect.objectContaining({
        phone: "+7 (421) 200-00-00",
        channels: [
          { id: "vk", label: "VK", href: "https://vk.com/bizon", enabled: false },
          { id: expect.stringMatching(/^channel-/), label: "Дзен", href: "https://dzen.ru/bizon", enabled: true },
        ],
      }),
    }));
  });

  it("edits the price and made-to-order notices and defaults a draft without them to empty text", async () => {
    const contactDraft = {
      id: "contact",
      seoTitle: "Контакты",
      seoDescription: "",
      hero: { eyebrow: "", title: "", lead: "" },
      documents: [],
      siteProfile: {
        phone: "",
        email: "",
        address: "",
        legalSummary: "",
        requisites: [],
        channels: [],
      },
    };
    const record = { ...pageRecord, id: "contact", draft: contactDraft, savedDraft: contactDraft, publishedSnapshot: contactDraft };
    const savePage = vi.fn().mockImplementation(async (_key: string, next: typeof contactDraft) => ({ ...record, draft: next, savedDraft: next }));
    mockState.client.getPage = vi.fn().mockResolvedValue(record);
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "contact" }));

    const priceNotice = await screen.findByLabelText("Цены и наличие");
    expect(priceNotice).toHaveProperty("value", "");
    expect(screen.getByLabelText("Товар под заказ")).toHaveProperty("value", "");
    await user.type(priceNotice, "Цены ориентировочные.");
    await user.type(screen.getByLabelText("Товар под заказ"), "Часть продукции — под заказ.");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect((await screen.findByRole("status")).textContent).toBe("Черновик сохранён");
    expect(savePage).toHaveBeenCalledWith("contact", expect.objectContaining({
      siteProfile: expect.objectContaining({
        priceNotice: "Цены ориентировочные.",
        madeToOrderNotice: "Часть продукции — под заказ.",
      }),
    }));
  });

  it("shows a PDF upload failure beside the document control", async () => {
    const legalDraft = { id: "privacy-policy", seoTitle: "Политика", seoDescription: "", hero: { eyebrow: "", title: "", lead: "" }, documents: [] };
    mockState.client.getPage = vi.fn().mockResolvedValue({ ...pageRecord, id: "privacy-policy", draft: legalDraft, savedDraft: legalDraft, publishedSnapshot: legalDraft });
    mockState.client.createAsset = vi.fn().mockRejectedValue(new Error("storage offline"));
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "privacy-policy" }));

    await user.upload(await screen.findByLabelText("Загрузить PDF"), new File(["pdf"], "policy.pdf", { type: "application/pdf" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось загрузить файл");
  });

  it("edits the supplier form: success text, a field, and removal; the about page has no form editor", async () => {
    const supplierDraft = {
      id: "become-a-supplier",
      seoTitle: "Поставщикам",
      seoDescription: "",
      hero: { eyebrow: "", title: "", lead: "" },
      documents: [],
      form: {
        successMessage: "Спасибо за предложение.",
        fields: [
          { id: "companyName", label: "Название компании", type: "text", required: true },
          { id: "companySite", label: "Сайт", type: "url", required: false },
        ],
      },
    };
    const record = { ...pageRecord, id: "become-a-supplier", draft: supplierDraft, savedDraft: supplierDraft, publishedSnapshot: supplierDraft };
    const savePage = vi.fn().mockImplementation(async (_key: string, next: typeof supplierDraft) => ({ ...record, draft: next, savedDraft: next }));
    mockState.client.getPage = vi.fn().mockResolvedValue(record);
    mockState.client.savePage = savePage;
    const user = userEvent.setup();
    render(createElement(PageEditor, { pageKey: "become-a-supplier" }));

    expect(await screen.findByLabelText("Текст после отправки")).toHaveProperty("value", "Спасибо за предложение.");
    expect(screen.getByDisplayValue("Название компании")).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Файл" })).toBeNull();
    await user.click(within(screen.getByRole("group", { name: "Сайт" })).getByRole("button", { name: "Удалить поле" }));
    await user.click(screen.getByRole("button", { name: "Добавить поле" }));
    const created = screen.getByRole("group", { name: "Новое поле" });
    await user.type(within(created).getByLabelText("Название поля"), "Регион");
    await user.selectOptions(within(created).getByLabelText("Тип поля"), "textarea");
    await user.click(within(created).getByRole("checkbox", { name: "Обязательное" }));
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect((await screen.findByRole("status")).textContent).toBe("Черновик сохранён");
    expect(savePage).toHaveBeenCalledWith("become-a-supplier", expect.objectContaining({
      form: {
        successMessage: "Спасибо за предложение.",
        fields: [
          { id: "companyName", label: "Название компании", type: "text", required: true },
          { id: expect.stringMatching(/^field-/), label: "Регион", type: "textarea", required: true },
        ],
      },
    }));

    cleanup();
    mockState.client.getPage = vi.fn().mockResolvedValue(pageRecord);
    render(createElement(PageEditor, { pageKey: "about" }));
    await screen.findByLabelText("Заголовок страницы в поиске");
    expect(screen.queryByLabelText("Текст после отправки")).toBeNull();
  });

  it("does not throw on an older supplier draft without a form", async () => {
    const olderDraft = { ...draft, id: "become-a-supplier" };
    mockState.client.getPage = vi.fn().mockResolvedValue({ ...pageRecord, id: "become-a-supplier", draft: olderDraft, savedDraft: olderDraft, publishedSnapshot: olderDraft });
    render(createElement(PageEditor, { pageKey: "become-a-supplier" }));

    expect(await screen.findByLabelText("Текст после отправки")).toHaveProperty("value", "");
  });
});