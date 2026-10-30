import { describe, expect, it } from "vitest";

import { MIGRATIONS } from "./index";
import { pageSeoTitlesMigration } from "./0036-page-seo-titles";
import { publishedPageCopyMigration } from "./0035-published-page-copy";

describe("page search titles", () => {
  it("names warranty and delivery, and keeps the brand out of the stored title", () => {
    const sql = pageSeoTitlesMigration.sql;
    expect(sql).toContain("Гарантия и возврат");
    expect(sql).toContain("Доставка");
    expect(sql).toContain("Брендирование шин для спецтехники");
    expect(sql).not.toContain("| BIZON");
    expect(sql).not.toContain("| Bizon Tires");
    expect(MIGRATIONS.indexOf(pageSeoTitlesMigration)).toBe(MIGRATIONS.indexOf(publishedPageCopyMigration) + 1);
  });
});
