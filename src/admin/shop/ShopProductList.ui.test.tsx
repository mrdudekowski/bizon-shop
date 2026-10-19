// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>> }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mocks.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/admin/ui/catalogView", () => ({ useCatalogView: () => ({ view: "tiles", setView: vi.fn() }) }));
vi.mock("@/admin/ui/CatalogRow", () => ({
  CatalogRow: ({ title, tileImageUrl }: { title: string; tileImageUrl?: string | null }) =>
    createElement("div", { "data-testid": `category-${title}`, "data-tile-image": tileImageUrl ?? "" }),
}));
vi.mock("@/admin/ui/CatalogViewToggle", () => ({ CatalogViewToggle: () => null }));
vi.mock("@/admin/ui/CatalogCreateDialog", () => ({ CatalogCreateDialog: () => null }));
vi.mock("@/admin/ui/AdminLoading", () => ({ AdminLoading: () => null }));
vi.mock("@/admin/ui/DocumentUI", () => ({ useAdminRole: () => ["editor"], useCanPerform: () => false }));
vi.mock("@/admin/ui/Icon", () => ({ Icon: () => null }));

import { ShopProductList } from "./ShopProductList";

afterEach(cleanup);

it("uses the configured Shop catalog tile image for the matching category", async () => {
  const category = {
    id: "category-oils",
    draft: { id: "category-oils", name: "Масла", slug: "masla", description: "", sortOrder: 1, showInMenu: true, carousel: [] },
    savedDraft: null,
    publishedSnapshot: null,
    hidden: false,
  };
  mocks.client = {
    listShopCategories: vi.fn().mockResolvedValue([category]),
    listShopProducts: vi.fn().mockResolvedValue([]),
    listAssets: vi.fn().mockResolvedValue([{ id: "media-oils-tile", dataUrl: "https://cdn.example/oils.jpg" }]),
    getPage: vi.fn().mockResolvedValue({ draft: { id: "shop-home", catalog: { tiles: [{ categoryId: "category-oils", image: { assetId: "media-oils-tile" } }] } } }),
  };

  render(createElement(ShopProductList));

  await waitFor(() => expect(screen.getByTestId("category-Масла").getAttribute("data-tile-image")).toBe("https://cdn.example/oils.jpg"));
  expect(mocks.client.getPage).toHaveBeenCalledWith("shop-home");
});
