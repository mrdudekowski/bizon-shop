import { describe, expect, it } from "vitest";
import { legalPagesCmsContentMigration } from "./0016-legal-pages-cms-content";

describe("legal page CMS content migration", () => {
  it("copies the current page copy into editorial fields and keeps the privacy review warning", () => {
    expect(legalPagesCmsContentMigration.version).toBe("202610230016");
    expect(legalPagesCmsContentMigration.sql).toContain("'Гарантия и обращение'");
    expect(legalPagesCmsContentMigration.sql).toContain("'Подробности политики'");
    expect(legalPagesCmsContentMigration.sql).toContain("пример юридического адреса");
    expect(legalPagesCmsContentMigration.sql).toContain("privacy@example.bizon.ru");
    expect(legalPagesCmsContentMigration.sql).toContain("Перед production-запуском замените пример оператора");
  });

  it("does not overwrite page records that already have CMS editorial content", () => {
    expect(legalPagesCmsContentMigration.sql.match(/WHERE p\.editorial_configured = false/g)).toHaveLength(2);
    expect(legalPagesCmsContentMigration.sql.match(/AND p\.status::text = 'draft'/g)).toHaveLength(2);
    expect(legalPagesCmsContentMigration.sql).toContain("AND editorial_configured = false");
    expect(legalPagesCmsContentMigration.sql).toContain("AND status::text = 'draft'");
    expect(legalPagesCmsContentMigration.sql).not.toContain("SET status = 'published'");
    expect(legalPagesCmsContentMigration.sql).toContain("ON CONFLICT (_parent_id, id) DO NOTHING");
  });
});
