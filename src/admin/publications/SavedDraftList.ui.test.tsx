// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));

import type { PublicationDraftRef } from "@/admin/domain/types";
import { SavedDraftList } from "./SavedDraftList";

const showModalDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

const drafts: PublicationDraftRef[] = [
  { entityType: "tire-model", entityId: "4", title: "BIZON D930", hasPublishedVersion: true, draftVersion: "v1" },
  { entityType: "tire-model", entityId: "5", title: "BIZON DLA968", hasPublishedVersion: true, draftVersion: "v2" },
];

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

describe("saved publication drafts", () => {
  it("publishes exactly the selected drafts in one confirmed bulk action", async () => {
    const publishSavedDrafts = vi.fn().mockResolvedValue(undefined);
    const onUpdated = vi.fn();
    mockState.client = { publishSavedDrafts };
    const user = userEvent.setup();
    render(createElement(SavedDraftList, { drafts, onUpdated }));

    await user.click(screen.getByLabelText("Выбрать черновик: BIZON D930"));
    await user.click(screen.getByRole("button", { name: "Опубликовать выбранные (1)" }));
    expect(screen.getByRole("dialog").textContent).toContain("1 выбранных черновик");
    await user.click(screen.getByRole("dialog").querySelector("button.primary")!);

    expect(publishSavedDrafts).toHaveBeenCalledWith([drafts[0]]);
    expect(onUpdated).toHaveBeenCalledWith(expect.stringContaining("Опубликовано черновиков: 1"));
    expect(screen.getByRole("status").textContent).toContain("Статус обновления сайта отображается");
  });

  it("restores previous versions and clearly identifies newly created drafts", async () => {
    const restoreSavedDrafts = vi.fn().mockResolvedValue(undefined);
    mockState.client = { restoreSavedDrafts };
    const user = userEvent.setup();
    const newDraft = { entityType: "shop-product", entityId: "new-1", title: "Новый товар", hasPublishedVersion: false, draftVersion: "v3" } satisfies PublicationDraftRef;
    render(createElement(SavedDraftList, { drafts: [newDraft], onUpdated: vi.fn() }));

    expect(screen.getByText(/новая карточка/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Отменить черновик" }));
    expect(screen.getByRole("dialog").textContent).toContain("будут удалены");
    await user.click(screen.getByRole("button", { name: "Восстановить" }));

    expect(restoreSavedDrafts).toHaveBeenCalledWith([newDraft]);
  });

  it("reports a failed atomic batch without claiming any item was published", async () => {
    const publishSavedDrafts = vi.fn().mockRejectedValue(Object.assign(new Error("blocked"), { code: "publish_blocked" }));
    mockState.client = { publishSavedDrafts };
    const user = userEvent.setup();
    render(createElement(SavedDraftList, { drafts, onUpdated: vi.fn() }));

    await user.click(screen.getByLabelText("Выбрать все черновики"));
    await user.click(screen.getByRole("button", { name: "Опубликовать выбранные (2)" }));
    await user.click(screen.getByRole("dialog").querySelector("button.primary")!);

    expect(publishSavedDrafts).toHaveBeenCalledWith(drafts);
    expect(screen.getByRole("status").textContent).toContain("Операция отменена");
  });
});
