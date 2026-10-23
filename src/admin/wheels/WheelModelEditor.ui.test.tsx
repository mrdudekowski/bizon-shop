// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>>, setRole: vi.fn() }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mocks.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => createElement("a", props, children) }));
vi.mock("@/admin/ui/DocumentUI", () => ({ BlockNav: () => null, useAdminRole: () => ["editor", mocks.setRole] }));
vi.mock("@/admin/ui/DocumentReviewFooter", () => ({
  DocumentReviewFooter: ({ onSave, adminActions }: { onSave: () => void; adminActions: React.ReactNode }) =>
    createElement("div", null, createElement("button", { type: "button", onClick: onSave }, "Сохранить"), adminActions),
}));
vi.mock("@/admin/ui/AdminLoading", () => ({ AdminLoading: () => null }));
vi.mock("@/admin/media/PlacementFields", () => ({ ProductPhotoFields: () => null }));

import { WheelModelEditor } from "./WheelModelEditor";

const variant = { id: "variant-1", sizeLabel: "22.5×8.25", pcd: "10×335", color: "Серебристый", priceOnRequest: true, available: true };
const draft = {
  id: "model-1", name: "Диск", slug: "disk", wheelTypeId: "type-1", series: "DSR", material: "Алюминий",
  constructionMethod: "Кованый", fitmentNotes: "", descriptionShort: "", descriptionLong: "", gallery: [], documents: [],
  showInMenu: true, menuOrder: 1, variants: [variant],
};
const record = { id: "model-1", draft, savedDraft: draft, publishedSnapshot: draft, hidden: false, slugLocked: false, lastSavedBy: null, lastPublishedBy: null };
const type = { id: "type-1", draft: { id: "type-1", name: "Грузовые диски", slug: "truck", description: "", sortOrder: 1, showInMenu: true }, savedDraft: draft, publishedSnapshot: draft, hidden: false };

afterEach(cleanup);

describe("wheel model variant specification fields", () => {
  it("keeps a selected PDF document in the saved model draft", async () => {
    const user = userEvent.setup();
    mocks.client = {
      getWheelModel: vi.fn().mockResolvedValue(record),
      listWheelTypes: vi.fn().mockResolvedValue([type]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      createAsset: vi.fn().mockResolvedValue({ id: "pdf-1" }),
      saveWheelModel: vi.fn().mockImplementation(async (_id: string, nextDraft: typeof draft) => ({ ...record, draft: nextDraft, savedDraft: nextDraft })),
    };

    render(createElement(WheelModelEditor, { id: "model-1" }));
    await user.upload(await screen.findByLabelText("Загрузить PDF"), new File(["pdf"], "wheel-passport.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mocks.client.saveWheelModel).toHaveBeenCalledWith("model-1", expect.objectContaining({
      documents: [{ assetId: "pdf-1", title: "wheel-passport.pdf" }],
    }));
  });

  it("edits rich wheel specs and preserves them in the saved draft", async () => {
    const user = userEvent.setup();
    mocks.client = {
      getWheelModel: vi.fn().mockResolvedValue(record),
      listWheelTypes: vi.fn().mockResolvedValue([type]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      saveWheelModel: vi.fn().mockImplementation(async (_id: string, nextDraft: typeof draft) => ({ ...record, draft: nextDraft, savedDraft: nextDraft })),
    };

    render(createElement(WheelModelEditor, { id: "model-1" }));
    await user.click(await screen.findByRole("button", { name: "Ещё" }));
    await user.type(await screen.findByLabelText("SKU"), "BIZON-22");
    await user.type(screen.getByLabelText("Диаметр"), "22.5");
    await user.type(screen.getByLabelText("Ширина"), "8.25");
    await user.type(screen.getByLabelText("Количество отверстий"), "10");
    await user.type(screen.getByLabelText("Допустимая нагрузка"), "4500 кг");
    await user.type(screen.getByLabelText("Покрытие"), "Порошковая окраска");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mocks.client.saveWheelModel).toHaveBeenCalledWith("model-1", expect.objectContaining({
      variants: [expect.objectContaining({ sku: "BIZON-22", diameter: 22.5, width: 8.25, boltHoles: 10, loadRating: "4500 кг", finish: "Порошковая окраска" })],
    }));
  });
});
