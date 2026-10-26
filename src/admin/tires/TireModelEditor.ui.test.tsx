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

import { TireModelEditor } from "./TireModelEditor";

const size = {
  id: "44",
  size: "12.00R20",
  sku: "DSR158-12.00R20",
  priceOnRequest: true,
  available: true,
  rimDiameter: 20,
  recommendedRim: "8.5",
  loadIndex: "156",
  loadIndexDual: "153",
  speedIndex: "J",
  plyRating: "20",
  overallDiameter: 1125,
  sectionWidth: 315,
  treadDepth: 18,
  pressureSingleKpa: 900,
  pressureDualKpa: 900,
  maxLoadSingleKg: 1814,
  maxLoadDualKg: 1656,
};

const draft = {
  id: "21",
  name: "BIZON DSR158",
  slug: "dsr158",
  directionId: "1",
  gallery: [],
  advantages: [],
  documents: [],
  sizes: [size],
  brand: "BIZON TBR",
  descriptionShort: "Грузовая шина",
  descriptionLong: "Описание",
  treadType: "Магистральный тяговый",
  modelCode: "DSR158",
  features: [],
  applicationTypes: ["long-haul"],
  selectionAxles: ["drive" as const],
  showInMenu: true,
  menuOrder: 0,
};

const record = {
  id: "21",
  draft,
  savedDraft: draft,
  publishedSnapshot: draft,
  hidden: false,
  slugLocked: true,
  lastSavedBy: null,
  lastPublishedBy: null,
};

const direction = {
  id: "1",
  name: "TBR — грузовые шины",
  slug: "tbr",
  status: "on_site" as const,
  hasUnpublishedDraft: false,
  imageAssetId: null,
};

afterEach(cleanup);

describe("TireModelEditor characteristics tab", () => {
  it("renders the Характеристики section with synced DB size parameters and saves edits", async () => {
    const user = userEvent.setup();
    mocks.client = {
      getTireModel: vi.fn().mockResolvedValue(record),
      listTireDirections: vi.fn().mockResolvedValue([direction]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      saveTireModel: vi.fn().mockImplementation(async (_id: string, nextDraft: typeof draft) => ({
        ...record,
        draft: nextDraft,
        savedDraft: nextDraft,
      })),
    };

    render(createElement(TireModelEditor, { id: "21" }));

    expect(await screen.findByRole("heading", { name: "Характеристики" })).toBeTruthy();
    expect(screen.getByText(/1125 мм/)).toBeTruthy();
    expect(screen.getByText(/156 \/ 153/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Ещё" }));

    const rimInput = await screen.findByLabelText("Диаметр обода");
    expect((rimInput as HTMLInputElement).value).toBe("20");

    const treadInput = screen.getByLabelText("Тип протектора");
    await user.clear(treadInput);
    await user.type(treadInput, "Усиленный магистральный");

    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mocks.client.saveTireModel).toHaveBeenCalledWith(
      "21",
      expect.objectContaining({
        brand: "BIZON TBR",
        treadType: "Усиленный магистральный",
        sizes: [
          expect.objectContaining({
            id: "44",
            size: "12.00R20",
            rimDiameter: 20,
            loadIndex: "156",
            loadIndexDual: "153",
            speedIndex: "J",
            plyRating: "20",
            overallDiameter: 1125,
            sectionWidth: 315,
            recommendedRim: "8.5",
          }),
        ],
      }),
    );
  });
});
