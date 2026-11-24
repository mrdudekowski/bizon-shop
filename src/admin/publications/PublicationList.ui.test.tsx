// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  client: {} as Record<string, ReturnType<typeof vi.fn>>,
  session: { role: "admin", login: "admin", capabilities: [] as string[] },
}));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));
vi.mock("@/admin/ui/DocumentUI", () => ({ useAdminSession: () => mockState.session }));

import { PublicationList } from "./PublicationList";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("publication list saved drafts", () => {
  it("shows administrator drafts on the publications page and filters them by status", async () => {
    mockState.client = {
      listChangeSets: vi.fn().mockResolvedValue([]),
      listPublicationDrafts: vi.fn().mockResolvedValue([
        { entityType: "tire-model", entityId: "4", title: "BIZON D930", hasPublishedVersion: true, draftVersion: "v1" },
      ]),
    };
    const user = userEvent.setup();
    render(createElement(PublicationList));

    expect(await screen.findByRole("heading", { name: "Черновики (1)" })).toBeTruthy();
    expect(screen.getByText("BIZON D930")).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Статус"), "drafts");
    expect(screen.getByRole("heading", { name: "Черновики (1)" })).toBeTruthy();
  });

  it("shows a load error instead of presenting an API failure as an empty queue", async () => {
    mockState.client = {
      listChangeSets: vi.fn().mockResolvedValue([]),
      listPublicationDrafts: vi.fn().mockRejectedValue(new Error("offline")),
    };
    render(createElement(PublicationList));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Ничего не найдено" })).toBeNull();
  });
});
