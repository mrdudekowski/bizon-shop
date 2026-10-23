// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>>, setRole: vi.fn() }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mocks.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => createElement("a", props, children) }));
vi.mock("@/admin/ui/DocumentUI", () => ({ useAdminRole: () => ["editor", mocks.setRole] }));
vi.mock("@/admin/ui/DocumentReviewFooter", () => ({
  DocumentReviewFooter: ({ onSave }: { onSave: () => void }) => createElement("button", { type: "button", onClick: onSave }, "Сохранить"),
}));
vi.mock("@/admin/ui/AdminLoading", () => ({ AdminLoading: () => null }));
vi.mock("@/admin/media/PlacementFields", () => ({ PlacementFields: () => null }));

import { WheelTypeEditor } from "./WheelTypeEditor";

const draft = { id: "type-1", name: "Кованые диски", slug: "forged", description: "Полный текст", shortDescription: "Короткий текст", sortOrder: 1, showInMenu: true };
const record = { id: "type-1", draft, savedDraft: draft, publishedSnapshot: draft, hidden: false, slugLocked: false, lastSavedBy: null, lastPublishedBy: null };

afterEach(cleanup);

describe("wheel type editor", () => {
  it("saves the short description as part of the CMS draft", async () => {
    const user = userEvent.setup();
    mocks.client = {
      getWheelType: vi.fn().mockResolvedValue(record),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      saveWheelType: vi.fn().mockImplementation(async (_id: string, nextDraft: typeof draft) => ({ ...record, draft: nextDraft, savedDraft: nextDraft })),
    };

    render(createElement(WheelTypeEditor, { id: "type-1" }));
    const field = await screen.findByLabelText("Короткое описание");
    await user.clear(field);
    await user.type(field, "Проверенное короткое описание");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mocks.client.saveWheelType).toHaveBeenCalledWith("type-1", expect.objectContaining({
      shortDescription: "Проверенное короткое описание",
    }));
  });
});
