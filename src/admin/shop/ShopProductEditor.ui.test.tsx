// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: {} as Record<string, ReturnType<typeof vi.fn>>, setRole: vi.fn() }));
vi.mock("@/admin/client/localStore", () => ({ browserAdminClient: () => mocks.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => createElement("a", props, children) }));
vi.mock("@/admin/ui/DocumentUI", () => ({
  BlockNav: () => null,
  useAdminRole: () => ["editor", mocks.setRole],
}));
vi.mock("@/admin/ui/DocumentReviewFooter", () => ({
  DocumentReviewFooter: ({ onSave, adminActions }: { onSave: () => void; adminActions: React.ReactNode }) =>
    createElement("div", null, createElement("button", { type: "button", onClick: onSave }, "Сохранить"), adminActions),
}));
vi.mock("@/admin/ui/AdminLoading", () => ({ AdminLoading: () => null }));
vi.mock("@/admin/ui/CatalogCreateDialog", () => ({ CatalogCreateDialog: () => null }));
vi.mock("@/admin/media/PlacementFields", () => ({
  ProductPhotoFields: () => null,
  PlacementFields: ({ label, value, onChange }: { label: string; value?: { assetId: string }; onChange: (image: { assetId: string; alt: string; focalX: number; focalY: number; crop: { x: number; y: number; width: number; height: number } }) => void }) =>
    createElement("button", {
      type: "button",
      "data-selected-asset": value?.assetId ?? "",
      onClick: () => onChange({ assetId: "media-variant-1", alt: "Красный вариант", focalX: 0.5, focalY: 0.5, crop: { x: 0, y: 0, width: 1, height: 1 } }),
    }, label),
}));

import { ShopProductEditor } from "./ShopProductEditor";
import styles from "./ShopDocument.module.css";

const variant = { id: "variant-1", color: "Красный", size: "M", sku: "RED-M", priceOnRequest: true, available: true };
const draft = {
  id: "product-1",
  name: "Чехол",
  slug: "case",
  categoryId: "category-1",
  descriptionShort: "",
  descriptionLong: "",
  priceOnRequest: true,
  gallery: [],
  variants: [variant],
};
const record = {
  id: "product-1",
  draft,
  savedDraft: draft,
  publishedSnapshot: draft,
  hidden: false,
  slugLocked: false,
  lastSavedBy: null,
  lastPublishedBy: null,
};
const category = {
  id: "category-1",
  draft: { id: "category-1", name: "Аксессуары", slug: "accessories", description: "", sortOrder: 1, showInMenu: true, carousel: [] },
  savedDraft: draft,
  publishedSnapshot: draft,
  hidden: false,
};

afterEach(cleanup);

// JSDOM does not evaluate media queries. Flatten matching width rules so its
// computed styles exercise the same cascade at each responsive breakpoint.
function renderStylesAtWidth(width: number) {
  const moduleCss = readFileSync("src/admin/shop/ShopDocument.module.css", "utf8")
    .replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => styles[name] ? `.${styles[name]}` : selector);
  const source = document.createElement("style");
  source.textContent = readFileSync("src/app/globals.css", "utf8") + moduleCss;
  document.head.append(source);
  const flatten = (rules: CSSRuleList): string => Array.from(rules).map((rule) => {
    if (rule instanceof CSSMediaRule) {
      const matches = Array.from(rule.conditionText.matchAll(/(min|max)-width:\s*(\d+)px/g))
        .every(([, bound, value]) => bound === "min" ? width >= Number(value) : width <= Number(value));
      return matches ? flatten(rule.cssRules) : "";
    }
    return rule.cssText;
  }).join("\n");
  const css = flatten(source.sheet!.cssRules);
  source.remove();
  render(createElement("style", null, css));
}

describe("Shop product variant images", () => {
  it.each([[390, "minmax(0, 1fr)"], [768, "repeat(2, minmax(0, 1fr))"], [1200, "repeat(3, minmax(0, 1fr))"]])(
    "uses shrinkable labeled fields at %ipx without a mismatched column header",
    async (width, columns) => {
      mocks.client = {
        getShopProduct: vi.fn().mockResolvedValue(record),
        listShopCategories: vi.fn().mockResolvedValue([category]),
        listShopSubcategories: vi.fn().mockResolvedValue([]),
        getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      };
      renderStylesAtWidth(Number(width));
      render(createElement(ShopProductEditor, { id: "product-1" }));
      const row = (await screen.findByLabelText("Комплектация")).closest("fieldset")!;
      expect.soft(row.parentElement!.querySelector(".collectionHead")).toBeNull();
      expect.soft(getComputedStyle(row).gridTemplateColumns).toBe(columns);
      for (const element of [row.parentElement!, row, ...row.querySelectorAll(":scope > label")]) {
        const css = getComputedStyle(element);
        expect(css.minWidth).toBe("0px");
        expect(css.maxWidth).toBe("100%");
      }
      for (const label of row.querySelectorAll(":scope > label > span:first-of-type")) {
        const css = getComputedStyle(label);
        expect(css.position).not.toBe("absolute");
        expect(css.clipPath).not.toBe("inset(50%)");
      }
      const actions = screen.getByRole("button", { name: "Убрать вариант 1" }).parentElement!;
      expect(getComputedStyle(actions).gridColumn).toBe("1 / -1");
    },
  );
  it("keeps the configuration label visible in the desktop collection", async () => {
    mocks.client = {
      getShopProduct: vi.fn().mockResolvedValue(record),
      listShopCategories: vi.fn().mockResolvedValue([category]),
      listShopSubcategories: vi.fn().mockResolvedValue([]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
    };
    const globalCss = readFileSync("src/app/globals.css", "utf8");
    const moduleCss = readFileSync("src/admin/shop/ShopDocument.module.css", "utf8")
      .replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => styles[name] ? `.${styles[name]}` : selector);
    render(createElement("style", null, globalCss + moduleCss));
    render(createElement(ShopProductEditor, { id: "product-1" }));

    const input = await screen.findByLabelText("Комплектация");
    const label = input.closest("label")?.querySelector("span");
    expect(label?.textContent).toBe("Комплектация");
    const computed = getComputedStyle(label!);
    expect(computed.position).not.toBe("absolute");
    expect(computed.clipPath).not.toBe("inset(50%)");
    expect(computed.width).not.toBe("1px");
  });

  it("spans the variant photo across the full collection row", async () => {
    mocks.client = {
      getShopProduct: vi.fn().mockResolvedValue(record),
      listShopCategories: vi.fn().mockResolvedValue([category]),
      listShopSubcategories: vi.fn().mockResolvedValue([]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
    };
    const moduleCss = readFileSync("src/admin/shop/ShopDocument.module.css", "utf8")
      .replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => styles[name] ? `.${styles[name]}` : selector);
    render(createElement("style", null, moduleCss));
    render(createElement(ShopProductEditor, { id: "product-1" }));

    const picker = await screen.findByRole("button", { name: "Фото варианта 1" });
    const computed = getComputedStyle(picker.parentElement!);
    expect(computed.gridColumn).toBe("1 / -1");
    expect(computed.minWidth).toBe("0px");
    expect(computed.maxWidth).toBe("100%");
  });

  it("selects a variant image and saves it with the corresponding variant", async () => {
    const user = userEvent.setup();
    mocks.client = {
      getShopProduct: vi.fn().mockResolvedValue(record),
      listShopCategories: vi.fn().mockResolvedValue([category]),
      listShopSubcategories: vi.fn().mockResolvedValue([]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      saveShopProduct: vi.fn().mockImplementation(async (_id: string, nextDraft: typeof draft) => ({ ...record, draft: nextDraft, savedDraft: nextDraft })),
    };

    render(createElement(ShopProductEditor, { id: "product-1" }));

    const imagePicker = await screen.findByRole("button", { name: "Фото варианта 1" });
    await user.clear(await screen.findByLabelText("Цена до скидки"));
    await user.type(screen.getByLabelText("Цена до скидки"), "2500");
    await user.clear(screen.getByLabelText("Цена до скидки варианта 1"));
    await user.type(screen.getByLabelText("Цена до скидки варианта 1"), "2200");
    await user.click(imagePicker);
    expect((await screen.findByRole("button", { name: "Фото варианта 1" })).getAttribute("data-selected-asset")).toBe("media-variant-1");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mocks.client.saveShopProduct).toHaveBeenCalledWith("product-1", expect.objectContaining({
      oldPrice: 2500,
      variants: [expect.objectContaining({ id: "variant-1", oldPrice: 2200, image: expect.objectContaining({ assetId: "media-variant-1" }) })],
    }));
  });

  it("edits the variant configuration and saves it", async () => {
    const user = userEvent.setup();
    mocks.client = {
      getShopProduct: vi.fn().mockResolvedValue(record),
      listShopCategories: vi.fn().mockResolvedValue([category]),
      listShopSubcategories: vi.fn().mockResolvedValue([]),
      getSession: vi.fn().mockResolvedValue({ role: "editor" }),
      saveShopProduct: vi.fn().mockImplementation(async (_id: string, nextDraft: typeof draft) => ({ ...record, draft: nextDraft, savedDraft: nextDraft })),
    };

    render(createElement(ShopProductEditor, { id: "product-1" }));

    await user.type(await screen.findByLabelText("Комплектация"), "Long range");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mocks.client.saveShopProduct).toHaveBeenCalledWith("product-1", expect.objectContaining({
      variants: [expect.objectContaining({ id: "variant-1", configuration: "Long range" })],
    }));
  });
});
