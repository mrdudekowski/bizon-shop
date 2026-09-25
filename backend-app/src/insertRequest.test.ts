import { describe, expect, it } from "vitest";
import { insertRequest } from "./insertRequest";

describe("insertRequest", () => {
  it("stores a normalized lead and maps an unknown form to custom", async () => {
    const calls: { sql: string; params?: unknown[] }[] = [];
    const db = {
      async query(sql: string, params?: unknown[]) {
        calls.push({ sql, params });
        if (sql.includes("INSERT INTO requests")) return [{ id: 9 }];
        return [];
      },
    };

    await expect(
      insertRequest(db, {
        name: "Иван",
        phone: "+7000",
        sourceForm: "procurement",
        items: [{ itemType: "tire", itemName: "DSR188", tireModel: 22, tireVariant: 45, quantity: 2 }],
      }),
    ).resolves.toBe(9);

    expect(calls[0].sql).toContain("INSERT INTO requests");
    expect(calls[0].params?.[13]).toBe("custom");
    expect(calls[1].sql).toContain("INSERT INTO requests_items");
    expect(calls[2].params).toEqual([9, "items.catalogItem", 0, 22]);
    expect(calls[3].params).toEqual([9, "items.catalogVariant", 0, 45]);
  });
});