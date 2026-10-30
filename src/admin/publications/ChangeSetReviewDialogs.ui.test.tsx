// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import type { ChangeSet } from "@/admin/domain/types";
import { ChangeSetReviewDialogs } from "./ChangeSetReviewDialogs";
import { PublicationDetail } from "./PublicationDetail";

const showModalDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

function pendingPack(): ChangeSet {
  return {
    id: "change-1",
    authorUserId: "editor-id",
    authorLogin: "editor",
    status: "pending_review",
    createdAt: "2026-10-08T00:00:00.000Z",
    updatedAt: "2026-10-08T00:00:00.000Z",
    submittedAt: "2026-10-08T00:00:00.000Z",
    reviewedAt: null,
    reviewedByLogin: null,
    reviewComment: null,
    entries: [{
      id: "entry-1",
      entityType: "page",
      entityId: "about",
      entityTitle: "О компании",
      operation: "update",
      fieldChanges: [{
        path: "seoTitle",
        location: { section: "Страницы", document: "О компании", tab: "Поиск", field: "Заголовок" },
        before: { kind: "text", value: "До" },
        after: { kind: "text", value: "После" },
      }],
      rollbackDraft: {},
    }],
  };
}

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.open = false; } });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (showModalDescriptor) Object.defineProperty(HTMLDialogElement.prototype, "showModal", showModalDescriptor);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  if (closeDescriptor) Object.defineProperty(HTMLDialogElement.prototype, "close", closeDescriptor);
  else delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
});

describe("publication review actions", () => {
  it("asks for approval and reports a successful publish", async () => {
    const pack = pendingPack();
    const publishChangeSet = vi.fn().mockResolvedValue({ ...pack, status: "published", reviewedByLogin: "admin" });
    const onUpdated = vi.fn();
    mockState.client = { publishChangeSet };
    const user = userEvent.setup();
    render(createElement(ChangeSetReviewDialogs, { pack, onUpdated }));

    await user.click(screen.getByRole("button", { name: "Опубликовать" }));
    expect(screen.getByText(/Посетители увидят новую версию/i)).toBeTruthy();
    await user.click(screen.getByRole("dialog").querySelector('button[type="submit"]')!);

    expect(publishChangeSet).toHaveBeenCalledWith("change-1");
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }), expect.stringContaining("Пакет опубликован"));
  });

  it("requires a return comment and submits its trimmed text", async () => {
    const pack = pendingPack();
    const returnChangeSet = vi.fn().mockResolvedValue({ ...pack, status: "returned", reviewComment: "нужно уточнить" });
    const onUpdated = vi.fn();
    mockState.client = { returnChangeSet };
    const user = userEvent.setup();
    render(createElement(ChangeSetReviewDialogs, { pack, onUpdated }));

    await user.click(screen.getByRole("button", { name: "Вернуть" }));
    const submit = screen.getByRole("dialog").querySelector('button[type="submit"]')!;
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByLabelText("Комментарий"), "  нужно уточнить  ");
    await user.click(submit);

    expect(returnChangeSet).toHaveBeenCalledWith("change-1", "нужно уточнить");
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: "returned" }), "Пакет вернули на доработку.");
  });

  it("explains cancel effects before applying them", async () => {
    const pack = pendingPack();
    const cancelChangeSet = vi.fn().mockResolvedValue({ ...pack, status: "cancelled" });
    const onUpdated = vi.fn();
    mockState.client = { cancelChangeSet };
    const user = userEvent.setup();
    render(createElement(ChangeSetReviewDialogs, { pack, onUpdated }));

    await user.click(screen.getByRole("button", { name: "Отменить" }));
    expect(screen.getByText(/Опубликованная версия на сайте не изменится/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Отменить изменения" }));

    expect(cancelChangeSet).toHaveBeenCalledWith("change-1");
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: "cancelled" }), expect.stringContaining("Пакет отменён"));
  });

  it("does not load or expose review controls to an editor", async () => {
    const getChangeSet = vi.fn();
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "editor", role: "editor", capabilities: [] }),
      getChangeSet,
    };
    render(createElement(PublicationDetail, { id: "change-1" }));

    expect(await screen.findByText("Этот раздел недоступен")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Опубликовать" })).toBeNull();
    expect(getChangeSet).not.toHaveBeenCalled();
  });

  it("accepts a delivery page entry and shows no accept button on a tire entry", async () => {
    const pack = pendingPack();
    pack.entries = [
      {
        ...pack.entries[0],
        id: "entry-delivery",
        entityId: "delivery",
        entityTitle: "Доставка",
      },
      {
        id: "entry-tire",
        entityType: "tire-model",
        entityId: "tire-1",
        entityTitle: "Модель шины",
        operation: "update",
        fieldChanges: pack.entries[0].fieldChanges,
        rollbackDraft: {},
      },
    ];
    const remaining = { ...pack, entries: pack.entries.filter((entry) => entry.id !== "entry-delivery") };
    const decidePageEntry = vi.fn().mockResolvedValue(remaining);
    mockState.client = {
      getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
      getChangeSet: vi.fn().mockResolvedValue(pack),
      decidePageEntry,
    };
    const user = userEvent.setup();
    render(createElement(PublicationDetail, { id: pack.id }));

    const accept = await screen.findByRole("button", { name: "Принять" });
    expect(screen.getAllByRole("button", { name: "Принять" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeTruthy();
    const tireSection = screen.getByText("Модель шины").closest("section");
    expect(tireSection?.querySelector("button")).toBeNull();

    await user.click(accept);
    expect(decidePageEntry).toHaveBeenCalledWith(pack.id, "entry-delivery", "accept");
    expect(await screen.findByText("Страница принята.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Принять" })).toBeNull();
    expect(screen.getByText("Модель шины")).toBeTruthy();
  });
});
