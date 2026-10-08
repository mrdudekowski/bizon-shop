import type { RequestItemInput } from "@/types/requestItem";
import { publicApiUrl } from "@/lib/publicApi";
import type { CartKind } from "@/lib/cart/cartTypes";

export const CART_STORAGE_KEY = "bizon-cart";
export const LEGACY_CART_STORAGE_KEY = CART_STORAGE_KEY;
export const CART_COOKIE_NAME = "bizon-cart-v1";
export const CART_UPDATED_EVENT = "bizon-cart-updated";
export const CART_OPEN_EVENT = "bizon-cart-open";
export const LEGACY_UNMAPPED_CART_KEY = "bizon-cart:legacy-unmapped";
const MIGRATION_KEY = "bizon-cart:migrated-v2";
const MAX_CART_LINES = 24;
const PENDING_MIGRATION_KEY = "bizon-cart:migration-pending-v2";
type PendingMigration = {
  bizonItems: RequestItemInput[];
  shopItems: RequestItemInput[];
  unmappedItems: RequestItemInput[];
  recoveryBaseItems: RequestItemInput[];
  recoveryItems: RequestItemInput[];
};

export function cartStorageKey(kind: CartKind): string {
  return `bizon-cart:${kind}`;
}
function cartCookieName(kind: CartKind): string {
  return kind === "bizon" ? "bizon-site-cart-v1" : "bizon-shop-cart-v1";
}
export function isCartItemAllowed(kind: CartKind, item: RequestItemInput): boolean {
  return kind === "bizon" ? item.itemType === "tire" : item.itemType === "wheel" || item.itemType === "shopProduct";
}
export function cartItemKey(item: RequestItemInput): string {
  const type = String(item.itemType ?? "shopProduct");
  const id = String(item.itemId ?? item.productId ?? item.slug ?? "");
  const variant = String(item.variantId ?? "");
  return `${type}:${id}:${variant}`;
}
export function mergeCartItem(items: RequestItemInput[], incoming: RequestItemInput): RequestItemInput[] {
  const key = cartItemKey(incoming);
  const quantity = Math.min(Math.max(incoming.quantity ?? 1, 1), 99999);
  const index = items.findIndex((item) => cartItemKey(item) === key);
  if (index >= 0) {
    const next = [...items];
    next[index] = { ...next[index], ...incoming, quantity: Math.min((next[index].quantity ?? 1) + quantity, 99999) };
    return next;
  }
  return [...items, { ...incoming, quantity }];
}
function parseStoredCart(raw: string | null): RequestItemInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object") as RequestItemInput[];
  } catch { return []; }
}
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((value) => value.startsWith(`${name}=`));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(name.length + 1)); } catch { return null; }
}
function compactCart(items: RequestItemInput[]): RequestItemInput[] {
  return items.slice(0, MAX_CART_LINES).map((item) => ({
    itemType: item.itemType, itemId: item.itemId, variantId: item.variantId, name: item.name,
    slug: item.slug, parentSlug: item.parentSlug, quantity: item.quantity,
    priceOnRequest: item.priceOnRequest, url: item.url, variantLabel: item.variantLabel,
    notes: item.notes, meta: item.meta,
  }));
}
export function readCart(kind: CartKind): RequestItemInput[] {
  if (typeof window === "undefined") return [];
  const cookieItems = parseStoredCart(readCookie(cartCookieName(kind)));
  const stored = cookieItems.length ? cookieItems : parseStoredCart(window.localStorage.getItem(cartStorageKey(kind)));
  return stored.filter((item) => isCartItemAllowed(kind, item));
}
export function writeCart(kind: CartKind, items: RequestItemInput[]): void {
  if (typeof window === "undefined") return;
  const allowed = items.filter((item) => isCartItemAllowed(kind, item));
  const compact = compactCart(allowed);
  if (!updatePendingMigrationCart(kind, compact)) return;
  window.localStorage.setItem(cartStorageKey(kind), JSON.stringify(compact));
  syncCartToServer(kind, compact);
}
function updatePendingMigrationCart(kind: CartKind, items: RequestItemInput[]): boolean {
  if (typeof window === "undefined") return true;
  const storage = window.localStorage;
  const raw = storage.getItem(PENDING_MIGRATION_KEY);
  if (!raw) return true;
  try {
    const pending = JSON.parse(raw) as PendingMigration;
    if (kind === "bizon") pending.bizonItems = items;
    else pending.shopItems = items;
    pending.recoveryItems = [
      ...(pending.recoveryBaseItems ?? pending.recoveryItems ?? []),
      ...pending.bizonItems.slice(MAX_CART_LINES),
      ...pending.shopItems.slice(MAX_CART_LINES),
    ];
    storage.setItem(PENDING_MIGRATION_KEY, JSON.stringify(pending));
    return true;
  } catch {
    // Do not persist a cart change that cannot also be replayed by a pending migration.
    return false;
  }
}
export function replaceCartFromServer(kind: CartKind, items: RequestItemInput[]): void {
  if (typeof window === "undefined") return;
  const compact = compactCart(items.filter((item) => isCartItemAllowed(kind, item)));
  if (!updatePendingMigrationCart(kind, compact)) return;
  window.localStorage.setItem(cartStorageKey(kind), JSON.stringify(compact));
}
function cartEndpoint(kind: CartKind): string | null {
  const endpoint = publicApiUrl("/v1/cart");
  if (!endpoint) return null;
  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}kind=${kind}`;
}
function syncCartToServer(kind: CartKind, items: RequestItemInput[]): void {
  if (typeof window === "undefined") return;
  const endpoint = cartEndpoint(kind);
  if (!endpoint) return;
  void fetch(endpoint, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }), credentials: "include" });
}
export async function loadServerCart(kind: CartKind): Promise<RequestItemInput[] | null> {
  if (typeof window === "undefined") return null;
  const endpoint = cartEndpoint(kind);
  if (!endpoint) return null;
  const response = await fetch(endpoint, { credentials: "include" });
  if (!response.ok) return null;
  const body = await response.json() as { hasSession?: boolean; items?: RequestItemInput[] };
  if (body.hasSession !== true) return null;
  return (body.items ?? []).filter((item) => isCartItemAllowed(kind, item));
}

export async function migrateLegacyCart(): Promise<{ bizonItems: RequestItemInput[]; shopItems: RequestItemInput[]; unmappedItems: RequestItemInput[] }> {
  const empty = { bizonItems: [], shopItems: [], unmappedItems: [] };
  if (typeof window === "undefined") return empty;
  const storage = window.localStorage;
  const pendingKey = PENDING_MIGRATION_KEY;
  if (storage.getItem(MIGRATION_KEY) === "true" && !storage.getItem(pendingKey)) return empty;


  let pending: PendingMigration | null = null;
  try {
    const rawPending = storage.getItem(pendingKey);
    if (rawPending) pending = JSON.parse(rawPending) as PendingMigration;
    if (!pending) {
      const legacy = parseStoredCart(storage.getItem(LEGACY_CART_STORAGE_KEY));
      if (!legacy.length) return empty;
      const existingBizon = parseStoredCart(storage.getItem(cartStorageKey("bizon"))).filter((item) => isCartItemAllowed("bizon", item));
      const existingShop = parseStoredCart(storage.getItem(cartStorageKey("shop"))).filter((item) => isCartItemAllowed("shop", item));
      const combine = (existing: RequestItemInput[], additions: RequestItemInput[]) => additions.reduce((items, item) => mergeCartItem(items, item), existing);
      const allBizon = combine(existingBizon, legacy.filter((item) => isCartItemAllowed("bizon", item)));
      const allShop = combine(existingShop, legacy.filter((item) => isCartItemAllowed("shop", item)));
      const unmappedItems = legacy.filter((item) => !isCartItemAllowed("bizon", item) && !isCartItemAllowed("shop", item));
      const recoveryBaseItems = [
        ...parseStoredCart(storage.getItem(LEGACY_UNMAPPED_CART_KEY)),
        ...allBizon.slice(MAX_CART_LINES), ...allShop.slice(MAX_CART_LINES), ...unmappedItems,
      ];
      pending = { bizonItems: allBizon, shopItems: allShop, unmappedItems, recoveryBaseItems, recoveryItems: recoveryBaseItems };
      storage.setItem(pendingKey, JSON.stringify(pending));
    }

    // Replay this immutable snapshot after any interrupted write; never re-merge legacy lines.
    storage.setItem(LEGACY_UNMAPPED_CART_KEY, JSON.stringify(pending.recoveryItems));
    storage.setItem(cartStorageKey("bizon"), JSON.stringify(compactCart(pending.bizonItems)));
    storage.setItem(cartStorageKey("shop"), JSON.stringify(compactCart(pending.shopItems)));
    storage.setItem(MIGRATION_KEY, "true");
    storage.removeItem(LEGACY_CART_STORAGE_KEY);
    storage.removeItem(pendingKey);
    return { bizonItems: pending.bizonItems, shopItems: pending.shopItems, unmappedItems: pending.unmappedItems };
  } catch {
    return empty;
  }
}

export function dispatchCartUpdated(kind: CartKind): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cartKind: kind } }));
}
export function requestOpenCart(kind: CartKind): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT, { detail: { cartKind: kind } }));
}
export function addCartItem(kind: CartKind, incoming: RequestItemInput): RequestItemInput[] {
  if (!isCartItemAllowed(kind, incoming)) return readCart(kind);
  const next = mergeCartItem(readCart(kind), incoming);
  writeCart(kind, next); dispatchCartUpdated(kind); return next;
}
export function removeCartItem(kind: CartKind, key: string): RequestItemInput[] {
  const next = readCart(kind).filter((item) => cartItemKey(item) !== key);
  writeCart(kind, next); dispatchCartUpdated(kind); return next;
}
export function updateCartItemQuantity(kind: CartKind, key: string, quantity: number): RequestItemInput[] {
  const safeQuantity = Math.min(Math.max(Math.round(quantity), 1), 99999);
  const next = readCart(kind).map((item) => cartItemKey(item) === key ? { ...item, quantity: safeQuantity } : item);
  writeCart(kind, next); dispatchCartUpdated(kind); return next;
}
export function clearCart(kind: CartKind): RequestItemInput[] {
  writeCart(kind, []); dispatchCartUpdated(kind); return [];
}
