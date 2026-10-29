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
    const heroUpdates = sql.match(/UPDATE pages[\s\S]*?WHERE key = '(?:about|warranty)'[\s\S]*?;/g) ?? [];
    expect(heroUpdates).toHaveLength(2);
    for (const block of heroUpdates) {
      expect(block).toMatch(/btrim\(COALESCE\(stub_hero_lead, ''\)\) = '' OR stub_hero_lead =/);
    }
  });
});
