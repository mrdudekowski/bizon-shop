import { describe, expect, it } from "vitest";
import { CUSTOMER_COPY, SEEDED_COPY } from "../content/customerTemplateCopy";
import { MIGRATIONS } from "./index";
import { customerProseMigration } from "./0024-customer-prose";

const sqlLiteral = (text: string): string => `'${text.replaceAll("'", "''")}'`;

describe("customer prose migration", () => {
  it("seeds about and warranty paragraphs from shared customer copy", () => {
    expect(customerProseMigration.version).toBe("202610290024");
    for (const paragraph of CUSTOMER_COPY.about) {
      expect(customerProseMigration.sql).toContain(paragraph);
    }
    for (const paragraph of CUSTOMER_COPY.warranty) {
      expect(customerProseMigration.sql).toContain(paragraph);
    }
    expect(MIGRATIONS.at(-1)).toBe(customerProseMigration);
  });

  it("only replaces hero leads and feature rows that still match the previous seed", () => {
    const sql = customerProseMigration.sql;
    for (const previous of [SEEDED_COPY.aboutHeroLead, SEEDED_COPY.warrantyHeroLead]) {
      expect(sql).toContain(`stub_hero_lead = ${sqlLiteral(previous)}`);
    }
    for (const text of Object.values(SEEDED_COPY.aboutFeatureTexts)) {
      expect(sql).toContain(`AND text = ${sqlLiteral(text)}`);
    }
    for (const text of Object.values(SEEDED_COPY.warrantyFeatureTexts)) {
      expect(sql).toContain(`AND text = ${sqlLiteral(text)}`);
    }
    expect(sql).not.toMatch(/UPDATE pages SET stub_hero_lead/m);
    expect(sql).toMatch(
      /UPDATE pages[\s\S]*?editorial_sections_configured = true[\s\S]*?WHERE key IN \('about', 'warranty'\)/,
    );
    const heroUpdates = sql.match(/UPDATE pages\s+SET stub_hero_lead[\s\S]*?;/g) ?? [];
    expect(heroUpdates).toHaveLength(2);
    for (const block of heroUpdates) {
      expect(block).toMatch(/WHERE key = '(?:about|warranty)'/);
      expect(block).toMatch(/btrim\(COALESCE\(stub_hero_lead, ''\)\) = '' OR stub_hero_lead =/);
      expect(block).not.toContain("editorial_sections_configured");
    }
  });

  it("seeds shop delivery, payment, and returns prose from shared customer copy", () => {
    const sql = customerProseMigration.sql;
    for (const paragraph of [...CUSTOMER_COPY.delivery, ...CUSTOMER_COPY.payment, ...CUSTOMER_COPY.returns]) {
      expect(sql).toContain(paragraph);
    }
    expect(sql).toContain("Доставка");
    expect(sql).toContain("Оплата непосредственно на сайте не производится.");
    expect(sql).toContain("Возврат");
    expect(sql).toContain("'delivery-section-payment'");
    expect(sql).toMatch(/ON CONFLICT \(_parent_id, id\) DO NOTHING/);
  });

  it("only replaces delivery editorial sections while body still matches the 0017 seed", () => {
    const sql = customerProseMigration.sql;
    expect(sql).toContain(`section.body = ${sqlLiteral(SEEDED_COPY.deliverySectionShipping)}`);
    expect(sql).toContain(`section.body = ${sqlLiteral(SEEDED_COPY.deliverySectionReturns)}`);
    expect(sql).toMatch(
      /UPDATE pages[\s\S]*?editorial_sections_configured = true[\s\S]*?WHERE key = 'shop-delivery-returns'/,
    );
    const deliverySectionUpdates =
      sql.match(/UPDATE pages_editorial_sections[\s\S]*?delivery-section-(?:shipping|returns)[\s\S]*?;/g) ?? [];
    expect(deliverySectionUpdates.length).toBeGreaterThanOrEqual(2);
    for (const block of deliverySectionUpdates) {
      expect(block).toContain("section.body =");
      expect(block).not.toContain("editorial_sections_configured");
    }
  });
});
