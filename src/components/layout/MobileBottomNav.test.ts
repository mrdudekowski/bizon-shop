import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/shop/product/mega-pritsep" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

import { MobileBottomNav } from "./MobileBottomNav";

function renderShopNav() {
  return renderToStaticMarkup(createElement(MobileBottomNav, { context: "shop", cartCount: 0 }));
}

function renderMainNav() {
  return renderToStaticMarkup(createElement(MobileBottomNav, { context: "main", cartCount: 0 }));
}

function linkHtml(html: string, label: string) {
  const link = html
    .split("<a ")
    .slice(1)
    .map((part) => `<a ${part.split("</a>")[0]}</a>`)
    .find((item) => item.includes(label));
  expect(link, label).toBeTruthy();
  return link ?? "";
}

describe("MobileBottomNav shop current item", () => {
  it("does not mark Каталог current on a product page", () => {
    for (const path of ["/shop/product/mega-pritsep", "/shop/product/mega-pritsep/"]) {
      pathname.current = path;
      const html = renderShopNav();
      expect(linkHtml(html, "Каталог")).not.toContain('aria-current="page"');
      expect(html).not.toContain('aria-current="page"');
    }
  });

  it("keeps Каталог current on a category path", () => {
    pathname.current = "/shop/pritsepy";
    const html = renderShopNav();
    expect(linkHtml(html, "Каталог")).toContain('aria-current="page"');
  });
});

describe("MobileBottomNav request destinations", () => {
  it("keeps the Tires and Shop request destinations separate", () => {
    pathname.current = "/";
    const main = renderMainNav();
    const shop = renderShopNav();

    expect(linkHtml(main, "Заявка")).toContain('href="/cart"');
    expect(linkHtml(shop, "Заявка")).toContain('href="/shop/cart"');
  });
});
