import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/analytics/yandexMetrika", () => ({ trackEvent: vi.fn() }));
import { trackEvent } from "@/lib/analytics/yandexMetrika";
import { trackCartAddIfAllowed } from "@/hooks/useCart";
import { addCartItem, cartItemKey, clearCart, readCart, removeCartItem, updateCartItemQuantity } from "@/lib/cart/cartStorage";
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
afterEach(() => vi.unstubAllGlobals());

describe("typed cart storage", () => {
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
