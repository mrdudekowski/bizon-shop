import { describe, expect, it } from "vitest";
import { insertRequest } from "./insertRequest";

describe("insertRequest", () => {
  it("stores a normalized lead and preserves supported source forms", async () => {
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
    expect(calls[0].params?.[13]).toBe("procurement");
    expect(calls[1].sql).toContain("INSERT INTO requests_items");
    expect(calls[2].params).toEqual([9, "items.catalogItem", 0, 22]);
    expect(calls[3].params).toEqual([9, "items.catalogVariant", 0, 45]);
    expect(calls[4].sql).toContain("INSERT INTO request_email_notifications");
    expect(calls[4].params).toEqual([9]);
  });

  it.each(["procurement", "tire_cart", "shop_cart"])("preserves the %s source", async (sourceForm) => {
    const calls: { sql: string; params?: unknown[] }[] = [];
    const db = {
      async query(sql: string, params?: unknown[]) {
        calls.push({ sql, params });
        if (sql.includes("INSERT INTO requests")) return [{ id: 12 }];
        return [];
      },
    };

    await insertRequest(db, { sourceForm });

    expect(calls[0].params?.[13]).toBe(sourceForm);
  });
});
