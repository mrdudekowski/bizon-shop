import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");

describe("article taxonomy SQL contract", () => {
  it("reads and writes the deployed parent_id and quoted order columns", () => {
    const listStart = source.indexOf("async listMaterials");
    const publishStart = source.indexOf("async publishMaterial");
    const hideStart = source.indexOf("async hideMaterial", publishStart);
    const listBlock = source.slice(listStart, source.indexOf("async getMaterial", listStart));
    const getBlock = source.slice(source.indexOf("async getMaterial", listStart), source.indexOf("async createMaterial", listStart));
    const publishBlock = source.slice(publishStart, hideStart);
    const readSql = `${listBlock}\n${getBlock}`;

    expect(readSql).toContain("taxonomy.parent_id = tire_iq_articles.id");
    expect(readSql).toContain('ORDER BY taxonomy."order"');
    expect(readSql).not.toContain("taxonomy._parent_id");
    expect(publishBlock).toContain("DELETE FROM tire_iq_articles_taxonomy WHERE parent_id = $1");
    expect(publishBlock).toContain('INSERT INTO tire_iq_articles_taxonomy (parent_id, "order", value)');
  });
});
