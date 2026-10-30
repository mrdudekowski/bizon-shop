import { describe, expect, it } from "vitest";
import { CUSTOMER_COPY } from "../content/customerTemplateCopy";
import { PUBLIC_STUB_PAGE_KEYS } from "../publishedRead";
import { MIGRATIONS } from "./index";
import { deliveryGeographyEnumValueMigration } from "./0026-delivery-geography-page";
import { deliveryGeographyPageMigration } from "./0027-delivery-geography-page";
import { requestSourceFormDeliveryQuoteMigration } from "./0028-request-source-form-delivery-quote";

const quoted = (text: string): string => `'${text.replaceAll("'", "''")}'`;

describe("delivery geography page migrations", () => {
  it("publishes the page key to the public stub reader", () => {
    expect(PUBLIC_STUB_PAGE_KEYS).toContain("delivery-geography");
  });

  it("adds the enum value alone and registers both migrations last, in order", () => {
    expect(deliveryGeographyEnumValueMigration.sql.trim()).toBe(
      "ALTER TYPE enum_pages_key ADD VALUE IF NOT EXISTS 'delivery-geography';",
    );
    const enumMigration = MIGRATIONS.indexOf(deliveryGeographyEnumValueMigration);
    const pageMigration = MIGRATIONS.indexOf(deliveryGeographyPageMigration);
    expect(enumMigration).toBeGreaterThanOrEqual(0);
    expect(pageMigration).toBe(enumMigration + 1);
  });

  it("adds delivery_quote to the request source enum before any insert uses it", () => {
    expect(requestSourceFormDeliveryQuoteMigration.sql.trim()).toBe(
      "ALTER TYPE enum_requests_source_form ADD VALUE IF NOT EXISTS 'delivery_quote';",
    );
    const quoteMigration = MIGRATIONS.indexOf(requestSourceFormDeliveryQuoteMigration);
    const dropHeadings = MIGRATIONS.findIndex((migration) => migration.version === "202610300029");
    expect(quoteMigration).toBeGreaterThanOrEqual(0);
    expect(dropHeadings).toBe(quoteMigration + 1);
  });

  it("seeds the page row, section, and form from shared copy", () => {
    const sql = deliveryGeographyPageMigration.sql;
    const [lead, calculationFirst, calculationSecond] = CUSTOMER_COPY.geography;
    expect(sql).toContain(quoted(lead));
    expect(sql).toContain(quoted(`${calculationFirst}\n\n${calculationSecond}`));
    expect(sql).toContain(quoted(CUSTOMER_COPY.geographySuccess));
    expect(sql).toContain("'geography-calculation'");
    expect(sql).toContain("stub_hero_configured");
    expect(sql).toContain("editorial_sections_configured");
    expect(sql).toContain("editorial_configured");
  });

  it("seeds the seven form fields in order with the right types", () => {
    const rows = [...deliveryGeographyPageMigration.sql.matchAll(
      /\('delivery-geography', '(\w+)', (\d+), '([^']+)', '(\w+)', (true|false)\)/g,
    )].map(([, id, order, label, type, required]) => [id, Number(order), label, type, required === "true"]);
    expect(rows).toEqual([
      ["name", 0, "Имя или название компании", "text", true],
      ["phone", 1, "Телефон", "tel", true],
      ["email", 2, "Email", "email", false],
      ["region", 3, "Город или регион доставки", "text", true],
      ["product", 4, "Наименование или категория товара", "text", true],
      ["quantity", 5, "Необходимое количество", "text", false],
      ["comment", 6, "Комментарий или дополнительная информация", "textarea", false],
    ]);
  });

  it("is idempotent", () => {
    expect(deliveryGeographyPageMigration.sql).not.toMatch(/\bDELETE\b/);
    expect(deliveryGeographyPageMigration.sql).toMatch(/WHERE NOT EXISTS|ON CONFLICT/);
  });
});
