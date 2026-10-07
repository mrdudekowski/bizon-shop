import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(new URL("./ShopShowcaseEditor.tsx", import.meta.url), "utf8");
const shopPage = fs.readFileSync(new URL("../../app/shop/page.tsx", import.meta.url), "utf8");
const categoryEditor = fs.readFileSync(new URL("./ShopCategoryEditor.tsx", import.meta.url), "utf8");

describe("Shop showcase editor placement", () => {
  it("keeps carousel, category tiles, and catalog copy in the Shop page editor", () => {
    expect(source).toContain("Карусель главной");
    expect(source).toContain("Плитки категорий");
    expect(source).toContain("Страница каталога");
    expect(source).toContain('savePage("shop-home"');
    expect(source).toContain('publishPage("shop-home")');
    expect(source).toContain("categoryId: id");
  });

  it("does not keep category presentation controls in the category identity editor", () => {
    expect(shopPage).toContain("ShopShowcaseEditor");
    expect(categoryEditor).not.toContain("Показывать в меню");
    expect(categoryEditor).not.toContain("Фото галереи");
  });
});
