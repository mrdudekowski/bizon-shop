import type { RequestItemInput } from "@/types/requestItem";

export const CART_STORAGE_KEY = "bizon-cart";
export const CART_COOKIE_NAME = "bizon-cart-v1";
export const CART_UPDATED_EVENT = "bizon-cart-updated";
export const CART_OPEN_EVENT = "bizon-cart-open";

const MAX_CART_LINES = 24;

export function cartItemKey(item: RequestItemInput): string {
  const type = String(item.itemType ?? "shopProduct");
  const id = String(item.itemId ?? item.productId ?? item.slug ?? "");
  const variant = String(item.variantId ?? "");
  return `${type}:${id}:${variant}`;
}

export function mergeCartItem(
  items: RequestItemInput[],
  incoming: RequestItemInput,
): RequestItemInput[] {
  const key = cartItemKey(incoming);
  const quantity = Math.min(Math.max(incoming.quantity ?? 1, 1), 99999);
  const index = items.findIndex((item) => cartItemKey(item) === key);

  if (index >= 0) {
    const next = [...items];
    next[index] = {
      ...next[index],
      ...incoming,
      quantity: Math.min((next[index].quantity ?? 1) + quantity, 99999),
    };
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
  } catch {
    return [];
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return null;
  }
}

function compactCartForCookie(items: RequestItemInput[]): RequestItemInput[] {
  return items.slice(0, MAX_CART_LINES).map((item) => ({
    itemType: item.itemType,
    itemId: item.itemId,
    variantId: item.variantId,
    name: item.name,
    slug: item.slug,
    parentSlug: item.parentSlug,
    quantity: item.quantity,
    priceOnRequest: item.priceOnRequest,
    url: item.url,
    variantLabel: item.variantLabel,
    notes: item.notes,
  }));
}

export function readCart(): RequestItemInput[] {
  if (typeof window === "undefined") return [];
  const cookieCart = parseStoredCart(readCookie(CART_COOKIE_NAME));
  if (cookieCart.length > 0) return cookieCart;
  return parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY));
}

export function writeCart(items: RequestItemInput[]): void {
  if (typeof window === "undefined") return;
  const compactItems = compactCartForCookie(items);
  writeLocalCart(compactItems);
  syncCartToServer(compactItems);
}

export function replaceCartFromServer(items: RequestItemInput[]): void {
  if (typeof window === "undefined") return;
  writeLocalCart(compactCartForCookie(items));
}

function syncCartToServer(items: RequestItemInput[]): void {
  if (typeof window === "undefined") return;
  void fetch("/api/cart", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export async function loadServerCart(): Promise<RequestItemInput[] | null> {
  if (typeof window === "undefined") return null;
  const response = await fetch("/api/cart");
  if (!response.ok) return null;
  const body = (await response.json()) as { hasSession?: boolean; items?: RequestItemInput[] };
  if (body.hasSession !== true) return null;
  return body.items ?? [];
}

function writeLocalCart(compactItems: RequestItemInput[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(compactItems));
  } catch {
    // ponytail: quota exceeded — silently skip; user can still submit from current session state
  }

  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CART_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    document.cookie = `${CART_COOKIE_NAME}=; Path=/; Domain=.bizon.ru; Max-Age=0; SameSite=Lax${secure}`;
  } catch {
    // Legacy client-readable cookie can remain blocked; the server cookie is opaque and HttpOnly.
  }
}

export function dispatchCartUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function requestOpenCart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_OPEN_EVENT));
}

export function addCartItem(incoming: RequestItemInput): RequestItemInput[] {
  const next = mergeCartItem(readCart(), incoming);
  writeCart(next);
  dispatchCartUpdated();
  return next;
}

export function removeCartItem(key: string): RequestItemInput[] {
  const next = readCart().filter((item) => cartItemKey(item) !== key);
  writeCart(next);
  dispatchCartUpdated();
  return next;
}

export function updateCartItemQuantity(key: string, quantity: number): RequestItemInput[] {
  const safeQuantity = Math.min(Math.max(Math.round(quantity), 1), 99999);
  const next = readCart().map((item) =>
    cartItemKey(item) === key ? { ...item, quantity: safeQuantity } : item,
  );
  writeCart(next);
  dispatchCartUpdated();
  return next;
}

export function clearCart(): RequestItemInput[] {
  writeCart([]);
  dispatchCartUpdated();
  return [];
}

// ponytail: merge self-check — upgrade path: move to a tiny test file if cart rules grow
if (process.env.NODE_ENV !== "production") {
  const base = mergeCartItem([], {
    itemType: "tire",
    itemId: "1",
    name: "Test",
    quantity: 2,
  });
  console.assert(base.length === 1 && base[0]?.quantity === 2, "cart merge: add new item");

  const merged = mergeCartItem(base, {
    itemType: "tire",
    itemId: "1",
    name: "Test",
    quantity: 3,
  });
  console.assert(merged.length === 1 && merged[0]?.quantity === 5, "cart merge: sum quantities");

  const separate = mergeCartItem(merged, {
    itemType: "tire",
    itemId: "1",
    variantId: "9",
    name: "Test",
    quantity: 1,
  });
  console.assert(separate.length === 2, "cart merge: variant is separate line");
}
