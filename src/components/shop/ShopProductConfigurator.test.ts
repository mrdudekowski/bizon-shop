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
  default: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: unknown }) => createElement("img", { alt, src, ...props }),
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
  imageUrl: "https://example.com/cover.jpg",
  imageFocalX: 0.3,
  imageFocalY: 0.6,
  imageFocalByViewport: { desktop: { x: 0.2, y: 0.8 }, mobile: { x: 0.75, y: 0.25 } },
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
    expect(html).not.toContain("data-price-notice");
    const pin = html.match(/<button\b[^>]*aria-label="Закрепить это фото"[^>]*>/)?.[0] ?? "";
    expect(pin).toContain(styles.mainImage);

    const css = readFileSync(new URL("./ShopProductConfigurator.module.css", import.meta.url), "utf8");
    expect(declaredCursor(css, "mainImage")).toBe("pointer");
  });

  it("renders published responsive focal values on the corresponding cover image", () => {
    const html = renderToStaticMarkup(createElement(ShopProductConfigurator, { product }));
    expect(html).toContain('class="responsiveFocalImage"');
    expect(html).toContain("--focal-desktop:20% 80%");
    expect(html).toContain("--focal-tablet:30% 60%");
    expect(html).toContain("--focal-mobile:75% 25%");
  });
});
