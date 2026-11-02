import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CatalogProductGallery } from "./CatalogProductGallery";
import styles from "./TireCatalog.module.css";

function declaredCursor(css: string, className: string): string {
  const block = css.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  return block.match(/cursor:\s*([^;]+)/)?.[1]?.trim() ?? "";
}

describe("CatalogProductGallery pin control", () => {
  it("does not use a zoom cursor on the pin control", () => {
    const html = renderToStaticMarkup(createElement(CatalogProductGallery, {
      images: ["/photos/one.jpg", "/photos/two.jpg"],
      alt: "Шина",
      fallbackKey: "tire",
    }));
    const pin = html.match(/<button\b[^>]*aria-label="Закрепить это фото"[^>]*>/)?.[0] ?? "";
    expect(pin).toContain(styles.productMedia);

    const css = readFileSync(new URL("./TireCatalog.module.css", import.meta.url), "utf8");
    expect(declaredCursor(css, "productMedia")).toBe("pointer");
  });
});
