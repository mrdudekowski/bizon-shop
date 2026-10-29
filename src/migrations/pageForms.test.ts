import { describe, expect, it } from "vitest";
import { CUSTOMER_COPY } from "../content/customerTemplateCopy";
import { MIGRATIONS } from "./index";
import { pageFormsMigration } from "./0025-page-forms";

describe("page forms migration", () => {
  it("is the last migration and seeds the supplier form from shared copy", () => {
    const sql = pageFormsMigration.sql;
    expect(pageFormsMigration.version).toBe("202610290025");
    expect(MIGRATIONS.at(-1)).toBe(pageFormsMigration);
    expect(sql).toContain(CUSTOMER_COPY.supplierSuccess);
    expect(sql).not.toContain("delivery-geography");
    expect(sql.match(/ON CONFLICT[^;]*DO NOTHING/g)).toHaveLength(2);
  });

  it("seeds supplier fields in order", () => {
    const ids = [...pageFormsMigration.sql.matchAll(/\('become-a-supplier', '(\w+)', (\d+),/g)];
    expect(ids.map((match) => match[1])).toEqual([
      "companyName",
      "contactName",
      "phone",
      "email",
      "companySite",
      "category",
      "offer",
      "catalogFile",
    ]);
    expect(ids.map((match) => Number(match[2]))).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("adds answer and attachment columns to requests", () => {
    expect(pageFormsMigration.sql).toContain("ADD COLUMN IF NOT EXISTS form_answers jsonb");
    expect(pageFormsMigration.sql).toContain("ADD COLUMN IF NOT EXISTS attachment_url text");
  });
});
