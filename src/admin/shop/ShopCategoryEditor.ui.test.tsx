// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mockState.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }) }));

import { ShopCategoryEditor } from "./ShopCategoryEditor";

afterEach(cleanup);

it("keeps category identity settings separate from public presentation controls", async () => {
  const categoryDraft = { id: "cat-1", name: "Шины", slug: "tires", description: "Описание", sortOrder: 1, showInMenu: true, carousel: [] };
  mockState.client = {
    getShopCategory: vi.fn().mockResolvedValue({ id: "cat-1", draft: categoryDraft, savedDraft: categoryDraft, publishedSnapshot: categoryDraft, hidden: false, slugLocked: false, lastSavedBy: null, lastPublishedBy: null }),
    getSession: vi.fn().mockResolvedValue({ login: "admin", role: "admin", capabilities: [] }),
    listShopProducts: vi.fn().mockResolvedValue([]),
    listShopSubcategories: vi.fn().mockResolvedValue([]),
    listAssets: vi.fn().mockResolvedValue([]),
    listChangeSets: vi.fn().mockResolvedValue([]),
  };
  const user = userEvent.setup();
  render(createElement(ShopCategoryEditor, { id: "cat-1" }));

  await user.click(await screen.findByRole("tab", { name: "Настройки категории" }));

  expect(screen.getByRole("heading", { name: "Карточка категории" })).toBeTruthy();
  expect(screen.queryByText("Показывать в меню")).toBeNull();
  expect(screen.queryByText("Фото галереи")).toBeNull();
});
