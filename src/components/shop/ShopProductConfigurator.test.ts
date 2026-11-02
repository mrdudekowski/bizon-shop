import { readFileSync } from "node:fs";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { CmsProduct } from "@/lib/content/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/shop/product/mega-pritsep",
  useRouter: () => ({ replace: () => undefined }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => createElement("img", { alt, src }),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({ items: [], addItem: () => undefined }),
}));

import { ShopProductConfigurator } from "./ShopProductConfigurator";
import styles from "./ShopProductConfigurator.module.css";

const product: CmsProduct = {
  slug: "mega-pritsep",
  name: "Мега прицеп",
  categorySlug: "pritsepy",
  type: "trailer",
  brand: "BIZON",
  descriptionShort: "Коротко",
  descriptionLong: "Длинно",
  gallery: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
  priceOnRequest: true,
  available: true,
  variants: [],
};

function declaredCursor(css: string, className: string): string {
  const block = css.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  return block.match(/cursor:\s*([^;]+)/)?.[1]?.trim() ?? "";
}

describe("ShopProductConfigurator pin control", () => {
  it("does not use a zoom cursor on the pin control", () => {
    const html = renderToStaticMarkup(createElement(ShopProductConfigurator, { product }));
    const pin = html.match(/<button\b[^>]*aria-label="Закрепить это фото"[^>]*>/)?.[0] ?? "";
    expect(pin).toContain(styles.mainImage);

    const css = readFileSync(new URL("./ShopProductConfigurator.module.css", import.meta.url), "utf8");
    expect(declaredCursor(css, "mainImage")).toBe("pointer");
  });
});
