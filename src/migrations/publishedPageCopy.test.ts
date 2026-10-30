import { describe, expect, it } from "vitest";
import { PAGE_FORM_KEYS, PAGE_KEY_BY_SOURCE_FORM } from "../content/pageForm";
import { insertRequest } from "../insertRequest";
import { MIGRATIONS } from "./index";
import { pageFormSubmitLabelMigration } from "./0032-page-form-submit-label";
import { requestSourceFormShopMigration } from "./0033-request-source-form-shop";
import { copyPageFormsMigration } from "./0034-copy-page-forms";
import { publishedPageCopyMigration } from "./0035-published-page-copy";

describe("published page copy", () => {
  it("gives warranty a real chapter heading and keeps the new form keys", () => {
    const sql = publishedPageCopyMigration.sql;
    expect(sql).toContain("Обращение");
    expect(sql).not.toContain("Пример ниже не устанавливает");
    expect(PAGE_FORM_KEYS).toEqual(expect.arrayContaining(["delivery", "shop-warranty"]));
  });

  it("adds shop source forms in their own migration before any later insert", () => {
    expect(pageFormSubmitLabelMigration.version).toBe("202610300032");
    expect(requestSourceFormShopMigration.version).toBe("202610300033");
    expect(copyPageFormsMigration.version).toBe("202610300034");
    expect(publishedPageCopyMigration.version).toBe("202610300035");

    const sql = requestSourceFormShopMigration.sql.replace(/\s+/g, " ");
    expect(sql).toContain("ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_delivery'");
    expect(sql).toContain("ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_warranty'");
    expect(sql).toContain("ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'shop_supplier'");
    expect(sql).not.toMatch(/\bINSERT\b/i);

    const enumIndex = MIGRATIONS.indexOf(requestSourceFormShopMigration);
    expect(MIGRATIONS.indexOf(pageFormSubmitLabelMigration)).toBe(enumIndex - 1);
    expect(MIGRATIONS.indexOf(copyPageFormsMigration)).toBe(enumIndex + 1);
    expect(MIGRATIONS.indexOf(publishedPageCopyMigration)).toBe(enumIndex + 2);
    expect(copyPageFormsMigration.sql).not.toMatch(/DELETE FROM page_forms/i);
    expect(publishedPageCopyMigration.sql).not.toContain("delivery-geography");
    expect(publishedPageCopyMigration.sql).not.toContain("shop-delivery-returns");
  });

  it("copies each source form into its own rows and keeps the source mapping", () => {
    const sql = copyPageFormsMigration.sql;
    for (const [target, source] of [
      ["delivery", "delivery-geography"],
      ["shop-delivery", "delivery-geography"],
      ["shop-warranty", "warranty"],
      ["shop-become-a-supplier", "become-a-supplier"],
    ] as const) {
      expect(sql).toContain(`SELECT '${target}', success_message`);
      expect(sql).toContain(`WHERE page_key = '${source}'`);
    }
    expect(PAGE_KEY_BY_SOURCE_FORM).toMatchObject({
      supplier: "become-a-supplier",
      delivery_quote: "delivery",
      shop_delivery: "shop-delivery",
      shop_warranty: "shop-warranty",
      shop_supplier: "shop-become-a-supplier",
      branding: "branding",
      warranty: "warranty",
    });
  });

  it("stores shop source forms instead of rewriting them to custom", async () => {
    for (const sourceForm of ["shop_delivery", "shop_warranty", "shop_supplier"] as const) {
      let stored: unknown;
      await insertRequest(
        {
          async query(statement, params) {
            if (statement.includes("INSERT INTO requests (")) stored = params?.[13];
            return [{ id: 1 }];
          },
        },
        { name: "Иван", sourceForm },
      );
      expect(stored).toBe(sourceForm);
    }
  });
});
