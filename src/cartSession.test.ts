import { describe, expect, it } from "vitest";
import { hashCartToken, sanitizeCartItems, splitLegacyCartItems, sanitizeTypedCartItems, parseCartKind, mergeMigrationCartItems, migrateCartSessions } from "./cartSession";

describe("cart session", () => {
  it("stores a hash instead of the cookie token and drops extra item fields", () => {
    const token = "opaque-token";
    const hash = hashCartToken(token);
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(
      sanitizeCartItems([
        { itemType: "tire", itemId: "1", name: "DSR188", quantity: 2, secret: "no" },
      ]),
    ).toEqual([{ itemType: "tire", itemId: "1", name: "DSR188", quantity: 2 }]);
  });
});

describe("typed cart migration", () => {
  it("classifies known lines and retains unknown and overflow lines unchanged", () => {
    const tire = { itemType: "tire", itemId: "t", name: "Tire", quantity: 100000, secret: "drop" };
    const wheel = { itemType: "wheel", itemId: "w", name: "Wheel", quantity: 0 };
    const product = { itemType: "shopProduct", itemId: "p", name: "Product" };
    const unknown = { itemType: "future", itemId: "u", custom: { keep: true } };
    const extraTires = Array.from({ length: 24 }, (_, index) => ({ itemType: "tire", itemId: `extra-${index}` }));
    const split = splitLegacyCartItems([tire, wheel, product, unknown, ...extraTires]);
    expect(split.bizonItems[0]).toEqual({ itemType: "tire", itemId: "t", name: "Tire", quantity: 99999 });
    expect(split.bizonItems).toHaveLength(24);
    expect(split.shopItems).toEqual([
      { itemType: "wheel", itemId: "w", name: "Wheel", quantity: 1 },
      { itemType: "shopProduct", itemId: "p", name: "Product", quantity: 1 },
    ]);
    expect(split.unmappedItems).toEqual([unknown, extraTires[23]]);
  });

  it("preserves typed local lines without duplicating legacy matches", () => {
    const typed = [{ itemType: "tire", itemId: "same", quantity: 4 }, { itemType: "future", itemId: "unknown" }];
    const legacy = [{ itemType: "tire", itemId: "same", quantity: 1 }, { itemType: "tire", itemId: "new" }];
    const merged = mergeMigrationCartItems("bizon", typed, legacy);
    expect(merged.items).toEqual([
      { itemType: "tire", itemId: "same", quantity: 4 },
      { itemType: "tire", itemId: "new", quantity: 1 },
    ]);
    expect(merged.unmappedItems).toEqual([typed[1]]);
  });
  it("rejects missing and unsupported kinds and filters typed saves", () => {
    expect(parseCartKind(null)).toBeNull();
    expect(parseCartKind("other")).toBeNull();
    expect(parseCartKind("bizon")).toBe("bizon");
    expect(parseCartKind("shop")).toBe("shop");
    expect(sanitizeTypedCartItems("bizon", [
      { itemType: "tire", itemId: "t" },
      { itemType: "wheel", itemId: "w" },
    ])).toEqual([{ itemType: "tire", itemId: "t", quantity: 1 }]);
  });
});

type SessionRow = { items: unknown; expires_at: Date };
function fakeTransactionalDatabase(failSecondInsert = false) {
  let rows = new Map<string, SessionRow>();
  return {
    rows: () => rows,
    seed(token: string, items: unknown) {
      rows.set(hashCartToken(token), { items, expires_at: new Date(Date.now() + 86400000) });
    },
    async transaction<T>(run: (query: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>): Promise<T> {
      const draft = new Map(rows);
      let inserts = 0;
      const query = async (sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> => {
        if (sql.includes("pg_advisory_xact_lock")) return [];
        const hash = String(params[0]);
        if (sql.startsWith("SELECT items")) {
          const row = draft.get(hash);
          return row ? [row] : [];
        }
        if (sql.startsWith("DELETE FROM cart_sessions")) {
          draft.delete(hash);
          return [];
        }
        if (sql.startsWith("INSERT INTO cart_sessions")) {
          inserts += 1;
          if (failSecondInsert && inserts === 2) throw new Error("injected write failure");
          draft.set(hash, { items: JSON.parse(String(params[1])), expires_at: new Date(Date.now() + 86400000) });
          return [];
        }
        throw new Error("unexpected query: " + sql);
      };
      const result = await run(query);
      rows = draft;
      return result;
    },
  };
}

describe("transactional cart migration", () => {
  it("merges typed local lines with an existing server cart and deduplicates mirrors", async () => {
    const db = fakeTransactionalDatabase();
    const serverLine = { itemType: "tire", itemId: "server", name: "Server", quantity: 2 };
    const localLine = { itemType: "tire", itemId: "local", name: "Local", quantity: 1 };
    db.seed("new-bizon", [serverLine]);
    const result = await migrateCartSessions(db, {
      legacyToken: null, bizonToken: "new-bizon", shopToken: "new-shop",
      legacyCookieItems: [], legacyStorageItems: [],
      typedBizonItems: [serverLine, localLine], typedShopItems: [],
    });
    expect(result.bizonItems).toEqual([serverLine, localLine]);
  });

  it("keeps typed local lines when an existing server row is empty", async () => {
    const db = fakeTransactionalDatabase();
    const localLine = { itemType: "tire", itemId: "local", name: "Local", quantity: 1 };
    db.seed("new-bizon", []);
    const result = await migrateCartSessions(db, {
      legacyToken: null, bizonToken: "new-bizon", shopToken: "new-shop",
      legacyCookieItems: [], legacyStorageItems: [],
      typedBizonItems: [localLine], typedShopItems: [],
    });
    expect(result.bizonItems).toEqual([localLine]);
  });

  it("uses the old server session before client payload and returns identical carts on retry", async () => {
    const db = fakeTransactionalDatabase();
    const oldTire = { itemType: "tire", itemId: "old", quantity: 1 };
    const unknown = { itemType: "future", itemId: "keep" };
    const oldWheel = { itemType: "wheel", itemId: "old-wheel", quantity: 1 };
    const existingWheel = { itemType: "wheel", itemId: "existing-wheel", quantity: 3 };
    db.seed("legacy", [oldTire, oldWheel, unknown]);
    db.seed("new-shop", [existingWheel]);
    const args = {
      legacyToken: "legacy", bizonToken: "new-bizon", shopToken: "new-shop",
      legacyCookieItems: [{ itemType: "wheel", itemId: "cookie" }],
      legacyStorageItems: [{ itemType: "tire", itemId: "local" }],
      typedBizonItems: [], typedShopItems: [],
    };
    const first = await migrateCartSessions(db, args);
    expect(first).toEqual({
      bizonItems: [{ ...oldTire, quantity: 1 }], shopItems: [existingWheel, oldWheel], unmappedItems: [{ ...unknown, quantity: 1 }],
    });
    expect(db.rows().has(hashCartToken("legacy"))).toBe(false);
    expect(db.rows().has(hashCartToken("new-bizon"))).toBe(true);
    expect(db.rows().has(hashCartToken("new-shop"))).toBe(true);
    expect(await migrateCartSessions(db, args)).toEqual(first);
  });

  it("rolls back both typed writes and keeps the legacy source when a write fails", async () => {
    const db = fakeTransactionalDatabase(true);
    db.seed("legacy", [{ itemType: "tire", itemId: "old" }]);
    await expect(migrateCartSessions(db, {
      legacyToken: "legacy", bizonToken: "new-bizon", shopToken: "new-shop",
      legacyCookieItems: [], legacyStorageItems: [], typedBizonItems: [], typedShopItems: [],
    })).rejects.toThrow("injected write failure");
    expect([...db.rows().keys()]).toEqual([hashCartToken("legacy")]);
  });
});
