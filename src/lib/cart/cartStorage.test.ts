import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/analytics/yandexMetrika", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/yandexMetrika";
import { trackCartAddIfAllowed } from "@/hooks/useCart";
import { addCartItem, cartItemKey, clearCart, getCartMutationVersion, readCart, removeCartItem, updateCartItemQuantity } from "@/lib/cart/cartStorage";
import type { RequestItemInput } from "@/types/requestItem";

const memory = new Map<string, string>();
const tire: RequestItemInput = { itemType: "tire", itemId: "same", name: "Tire", quantity: 1 };
const wheel: RequestItemInput = { itemType: "wheel", itemId: "same", name: "Wheel", quantity: 1 };
const product: RequestItemInput = { itemType: "shopProduct", itemId: "product", name: "Product", quantity: 1 };
function installBrowser() {
  memory.clear();
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) }, location: { protocol: "http:" }, dispatchEvent: vi.fn(), addEventListener: vi.fn() });
  vi.stubGlobal("document", { cookie: "" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("typed cart storage", () => {
  it("advances the cart version after a local mutation so stale server reads can be ignored", () => {
    installBrowser();
    const before = getCartMutationVersion("bizon");
    addCartItem("bizon", tire);
    expect(getCartMutationVersion("bizon")).toBeGreaterThan(before);
    expect(getCartMutationVersion("shop")).toBe(0);
  });

  it("keeps cart ownership isolated and merges duplicates only within a cart", () => {
    installBrowser();
    expect(addCartItem("bizon", tire)).toHaveLength(1);
    expect(addCartItem("shop", wheel)).toHaveLength(1);
    expect(addCartItem("shop", product)).toHaveLength(2);
    expect(addCartItem("bizon", wheel)).toHaveLength(1);
    expect(addCartItem("shop", tire)).toHaveLength(2);
    addCartItem("bizon", { ...tire, quantity: 2 });
    addCartItem("shop", { ...wheel, quantity: 3 });
    expect(readCart("bizon").map((item) => item.quantity)).toEqual([3]);
    expect(readCart("shop").map((item) => item.quantity)).toEqual([4, 1]);
  });
  it("keeps quantity limits and removal/clear scoped to one cart", () => {
    installBrowser();
    addCartItem("bizon", tire);
    addCartItem("shop", wheel);
    updateCartItemQuantity("bizon", cartItemKey(tire), 100000);
    expect(readCart("bizon")[0]?.quantity).toBe(99999);
    updateCartItemQuantity("bizon", cartItemKey(tire), 0);
    expect(readCart("bizon")[0]?.quantity).toBe(1);
    removeCartItem("bizon", cartItemKey(tire));
    expect(readCart("bizon")).toEqual([]);
    expect(readCart("shop")).toHaveLength(1);
    clearCart("shop");
    expect(readCart("shop")).toEqual([]);
  });
});

// Legacy migration is idempotent and preserves unclassified lines for recovery.
describe("legacy cart migration", () => {
  it("splits known item types once and retains unmapped data", async () => {
    installBrowser();
    memory.set("bizon-cart", JSON.stringify([tire, wheel, product, { itemType: "mystery", itemId: "x" }]));
    const { migrateLegacyCart, LEGACY_UNMAPPED_CART_KEY } = await import("@/lib/cart/cartStorage");
    const split = await migrateLegacyCart();
    expect(split.bizonItems).toEqual([tire]);
    expect(split.shopItems).toEqual([wheel, product]);
    expect(split.unmappedItems).toHaveLength(1);
    expect(memory.has("bizon-cart")).toBe(false);
    expect(JSON.parse(memory.get(LEGACY_UNMAPPED_CART_KEY) ?? "[]")).toHaveLength(1);
    expect(await migrateLegacyCart()).toEqual({ bizonItems: [], shopItems: [], unmappedItems: [] });
  });

  it("leaves the legacy source intact when a destination write fails", async () => {
    installBrowser();
    memory.set("bizon-cart", JSON.stringify([tire]));
    const originalSet = window.localStorage.setItem;
    window.localStorage.setItem = (key: string, value: string) => {
      if (key === "bizon-cart:shop") throw new Error("blocked");
      originalSet(key, value);
    };
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    await migrateLegacyCart();
    expect(memory.has("bizon-cart")).toBe(true);
    window.localStorage.setItem = originalSet;
    await migrateLegacyCart();
    expect(readCart("bizon")).toEqual([tire]);
    expect(memory.has("bizon-cart")).toBe(false);
  });
});



describe("cart add analytics", () => {
  it("does not emit add analytics for an item rejected by cart ownership", () => {
    vi.mocked(trackEvent).mockClear();
    expect(trackCartAddIfAllowed("bizon", wheel)).toBe(false);
    expect(trackEvent).not.toHaveBeenCalled();
    expect(trackCartAddIfAllowed("bizon", tire)).toBe(true);
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });
});

describe("legacy migration safety regressions", () => {
  it("shares one in-flight migration across concurrent cart mounts", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    memory.set("bizon-cart", JSON.stringify([tire]));
    let resolveMigration!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    const fetchMock = vi.fn((_, init?: RequestInit) => init?.method === "POST"
      ? new Promise((resolve) => { resolveMigration = resolve; })
      : Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    const siteMigration = migrateLegacyCart();
    const pageMigration = migrateLegacyCart();
    expect(pageMigration).toBe(siteMigration);
    resolveMigration({ ok: true, json: async () => ({ bizonItems: [tire], shopItems: [], unmappedItems: [] }) });
    await Promise.all([siteMigration, pageMigration]);

    const added: RequestItemInput = { itemType: "tire", itemId: "after-migration", name: "After migration", quantity: 1 };
    addCartItem("bizon", added);
    expect(readCart("bizon")).toEqual([tire, added]);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);
  });

  it("does not promote unchanged legacy client lines over the old server session after another edit", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    const local: RequestItemInput = { itemType: "tire", itemId: "legacy-client", name: "Legacy", quantity: 1 };
    const server: RequestItemInput = { itemType: "tire", itemId: "legacy-server", name: "Server", quantity: 1 };
    const added: RequestItemInput = { itemType: "tire", itemId: "new-during-migration", name: "Added", quantity: 1 };
    memory.set("bizon-cart", JSON.stringify([local]));
    let resolveMigration!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    vi.stubGlobal("fetch", vi.fn((_, init?: RequestInit) => init?.method === "POST"
      ? new Promise((resolve) => { resolveMigration = resolve; })
      : Promise.resolve({ ok: true })));
    const { migrateLegacyCart, LEGACY_UNMAPPED_CART_KEY } = await import("@/lib/cart/cartStorage");
    const migration = migrateLegacyCart();
    addCartItem("bizon", added);
    resolveMigration({ ok: true, json: async () => ({ bizonItems: [server], shopItems: [], unmappedItems: [] }) });
    await migration;
    expect(readCart("bizon")).toEqual([server, added]);
    expect(JSON.parse(memory.get(LEGACY_UNMAPPED_CART_KEY) ?? "[]")).toContainEqual(local);
  });

  it("uses the server migration result as authoritative and keeps displaced local data recoverable", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    const local: RequestItemInput = { itemType: "tire", itemId: "local", name: "Local", quantity: 1 };
    const server: RequestItemInput = { itemType: "tire", itemId: "server", name: "Server", quantity: 2 };
    memory.set("bizon-cart", JSON.stringify([local]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bizonItems: [server], shopItems: [], unmappedItems: [] }),
    }));
    const { migrateLegacyCart, LEGACY_UNMAPPED_CART_KEY } = await import("@/lib/cart/cartStorage");
    await migrateLegacyCart();
    expect(readCart("bizon")).toEqual([server]);
    expect(JSON.parse(memory.get(LEGACY_UNMAPPED_CART_KEY) ?? "[]")).toContainEqual(local);
  });

  it("preserves and merges existing typed destination lines", async () => {
    installBrowser();
    const existing: RequestItemInput = { itemType: "tire", itemId: "existing", name: "Existing", quantity: 2 };
    memory.set("bizon-cart:bizon", JSON.stringify([existing]));
    memory.set("bizon-cart", JSON.stringify([tire]));
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    await migrateLegacyCart();
    expect(readCart("bizon")).toEqual([existing, tire]);
  });

  it("keeps destination overflow recoverable before removing the source", async () => {
    installBrowser();
    const manyWheels = Array.from({ length: 30 }, (_, index): RequestItemInput => ({ itemType: "wheel", itemId: `wheel-${index}`, name: `Wheel ${index}`, quantity: 1 }));
    memory.set("bizon-cart", JSON.stringify(manyWheels));
    const { migrateLegacyCart, LEGACY_UNMAPPED_CART_KEY } = await import("@/lib/cart/cartStorage");
    await migrateLegacyCart();
    expect(readCart("shop")).toHaveLength(24);
    const recoverable = JSON.parse(memory.get(LEGACY_UNMAPPED_CART_KEY) ?? "[]") as RequestItemInput[];
    expect(recoverable).toHaveLength(6);
    expect(new Set([...readCart("shop"), ...recoverable].map((item) => item.itemId)).size).toBe(30);
    expect(memory.has("bizon-cart")).toBe(false);
  });
});

describe("pending migration follows typed cart mutations", () => {
  it("preserves a cart addition made while server migration is in flight", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    memory.set("bizon-cart", JSON.stringify([tire]));
    let resolveMigration!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    vi.stubGlobal("fetch", vi.fn((_, init?: RequestInit) => init?.method === "POST"
      ? new Promise((resolve) => { resolveMigration = resolve; })
      : Promise.resolve({ ok: true })));
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    const migration = migrateLegacyCart();
    const added: RequestItemInput = { itemType: "tire", itemId: "during-migration", name: "Added during migration", quantity: 1 };
    addCartItem("bizon", added);
    resolveMigration({ ok: true, json: async () => ({ bizonItems: [tire], shopItems: [], unmappedItems: [] }) });
    await migration;
    expect(readCart("bizon")).toEqual([tire, added]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method)).toEqual(["POST", "PUT"]);
  });

  it("preserves additions during migration when the server has the only starting cart", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    const server: RequestItemInput = { itemType: "tire", itemId: "server-only", name: "Server", quantity: 1 };
    const added: RequestItemInput = { itemType: "tire", itemId: "during-migration-empty", name: "Added", quantity: 1 };
    let resolveMigration!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    vi.stubGlobal("fetch", vi.fn((_, init?: RequestInit) => init?.method === "POST"
      ? new Promise((resolve) => { resolveMigration = resolve; })
      : Promise.resolve({ ok: true })));
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    const migration = migrateLegacyCart();
    addCartItem("bizon", added);
    resolveMigration({ ok: true, json: async () => ({ bizonItems: [server], shopItems: [], unmappedItems: [] }) });
    await migration;
    expect(readCart("bizon")).toEqual([server, added]);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls.at(-1)?.[1]?.body))).toEqual({ items: [server, added] });
  });

  it("persists a second cart edited while the first post-migration save is pending", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    const shopItem: RequestItemInput = { itemType: "shopProduct", itemId: "shop-during-save", name: "Shop", quantity: 1 };
    let resolveMigration!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    let resolveBizonSave!: (response: { ok: boolean }) => void;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "POST") return new Promise((resolve) => { resolveMigration = resolve; });
      if (url.includes("kind=bizon")) return new Promise((resolve) => { resolveBizonSave = resolve; });
      return Promise.resolve({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    const migration = migrateLegacyCart();
    addCartItem("bizon", tire);
    resolveMigration({ ok: true, json: async () => ({ bizonItems: [], shopItems: [], unmappedItems: [] }) });
    await Promise.resolve();
    await Promise.resolve();
    addCartItem("shop", shopItem);
    resolveBizonSave({ ok: true });
    await migration;
    const puts = fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT");
    expect(puts.map(([url]) => url)).toEqual([
      "http://127.0.0.1:4000/v1/cart?kind=bizon",
      "http://127.0.0.1:4000/v1/cart?kind=shop",
    ]);
    expect(JSON.parse(String(puts[1]?.[1]?.body))).toEqual({ items: [shopItem] });
  });

  it("keeps a queued edit when migration PUT fails and a later server read succeeds", async () => {
    installBrowser();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:4000");
    const added: RequestItemInput = { itemType: "tire", itemId: "queued-after-failure", name: "Queued", quantity: 1 };
    let failSave = true;
    vi.stubGlobal("fetch", vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "POST") return Promise.resolve({ ok: true, json: async () => ({ bizonItems: [], shopItems: [], unmappedItems: [] }) });
      if (init?.method === "PUT" && failSave) { failSave = false; return Promise.resolve({ ok: false }); }
      if (init?.method === "GET" || !init?.method) return Promise.resolve({ ok: true, json: async () => ({ hasSession: true, items: [] }) });
      return Promise.resolve({ ok: true });
    }));
    const { migrateLegacyCart, loadServerCart, replaceCartFromServer } = await import("@/lib/cart/cartStorage");
    const migration = migrateLegacyCart();
    addCartItem("bizon", added);
    await migration;
    const serverItems = await loadServerCart("bizon");
    if (serverItems) replaceCartFromServer("bizon", serverItems);
    expect(readCart("bizon")).toEqual([added]);
    await migrateLegacyCart();
    expect(readCart("bizon")).toEqual([added]);
  });

  it("replays the latest quantity, removal, and addition after a partial write", async () => {
    installBrowser();
    const removed: RequestItemInput = { itemType: "tire", itemId: "remove-me", name: "Remove me", quantity: 1 };
    const added: RequestItemInput = { itemType: "tire", itemId: "added-later", name: "Added later", quantity: 1 };
    memory.set("bizon-cart", JSON.stringify([tire, removed]));
    const originalSet = window.localStorage.setItem;
    window.localStorage.setItem = (key: string, value: string) => {
      if (key === "bizon-cart:shop") throw new Error("interrupt migration");
      originalSet(key, value);
    };
    const { migrateLegacyCart } = await import("@/lib/cart/cartStorage");
    await migrateLegacyCart();
    window.localStorage.setItem = originalSet;

    updateCartItemQuantity("bizon", cartItemKey(tire), 7);
    removeCartItem("bizon", cartItemKey(removed));
    addCartItem("bizon", added);
    await migrateLegacyCart();

    expect(readCart("bizon")).toEqual([{ ...tire, quantity: 7 }, added]);
  });
});
