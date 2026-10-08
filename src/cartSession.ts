import { createHash } from "node:crypto";

import type { ReadDatabase } from "./publishedRead";

const MAX_CART_LINES = 24;
const SESSION_DAYS = 30;

const KEPT_FIELDS = [
  "itemType",
  "itemId",
  "variantId",
  "productId",
  "name",
  "title",
  "slug",
  "parentSlug",
  "quantity",
  "priceOnRequest",
  "url",
  "variantLabel",
  "notes",
] as const;

export type CartLine = Record<string, unknown>;
export type CartKind = "bizon" | "shop";

export function parseCartKind(value: string | null): CartKind | null {
  return value === "bizon" || value === "shop" ? value : null;
}

function belongsToCart(kind: CartKind, item: CartLine): boolean {
  return kind === "bizon" ? item.itemType === "tire" : item.itemType === "wheel" || item.itemType === "shopProduct";
}

export function sanitizeTypedCartItems(kind: CartKind, value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return sanitizeCartItems(value.filter((item) => item && typeof item === "object" && belongsToCart(kind, item as CartLine)));
}

export function splitLegacyCartItems(value: unknown): { bizonItems: CartLine[]; shopItems: CartLine[]; unmappedItems: CartLine[] } {
  const result = { bizonItems: [] as CartLine[], shopItems: [] as CartLine[], unmappedItems: [] as CartLine[] };
  if (!Array.isArray(value)) return result;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const source = item as CartLine;
    const destination = belongsToCart("bizon", source) ? result.bizonItems : belongsToCart("shop", source) ? result.shopItems : null;
    if (destination && destination.length < MAX_CART_LINES) destination.push(sanitizeCartItems([source])[0]);
    else result.unmappedItems.push(source);
  }
  return result;
}


export function hashCartToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sanitizeCartItems(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_CART_LINES).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const line: CartLine = {};
    for (const field of KEPT_FIELDS) {
      if (source[field] !== undefined) line[field] = source[field];
    }
    const quantity = Number(line.quantity ?? 1);
    line.quantity = Number.isFinite(quantity) ? Math.min(Math.max(Math.round(quantity), 1), 99999) : 1;
    return [line];
  });
}

export async function readCartSession(db: ReadDatabase, token: string): Promise<CartLine[] | null> {
  const [row] = await db.query(
    `SELECT items, expires_at FROM cart_sessions WHERE token_hash = $1`,
    [hashCartToken(token)],
  );
  if (!row) return null;
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(String(row.expires_at));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await db.query(`DELETE FROM cart_sessions WHERE token_hash = $1`, [hashCartToken(token)]);
    return null;
  }
  return sanitizeCartItems(row.items);
}

export async function saveCartSession(db: ReadDatabase, token: string, items: unknown): Promise<void> {
  const stored = sanitizeCartItems(items);
  await db.query(
    `INSERT INTO cart_sessions (token_hash, items, expires_at)
     VALUES ($1, $2::jsonb, now() + ($3 || ' days')::interval)
     ON CONFLICT (token_hash) DO UPDATE
       SET items = EXCLUDED.items, expires_at = EXCLUDED.expires_at, updated_at = now()`,
    [hashCartToken(token), JSON.stringify(stored), String(SESSION_DAYS)],
  );
}

export async function deleteCartSession(db: ReadDatabase, token: string): Promise<void> {
  await db.query(`DELETE FROM cart_sessions WHERE token_hash = $1`, [hashCartToken(token)]);
}

export const LEGACY_CART_SESSION_COOKIE = "bizon-cart-session-v1";
export const CART_SESSION_COOKIES: Record<CartKind, string> = {
  bizon: "bizon-site-cart-session-v1",
  shop: "bizon-shop-cart-session-v1",
};

export function migratedCartToken(legacyToken: string, kind: CartKind): string {
  return createHash("sha256").update("bizon-cart-migration-v2:").update(kind).update(":").update(legacyToken).digest("base64url");
}

export function recoveryCartToken(bizonToken: string): string {
  return "recovery:" + bizonToken;
}

export async function readRecoverySession(db: ReadDatabase, token: string): Promise<CartLine[] | null> {
  const [row] = await db.query("SELECT items, expires_at FROM cart_sessions WHERE token_hash = $1", [hashCartToken(token)]);
  if (!row) return null;
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(String(row.expires_at));
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await deleteCartSession(db, token);
    return null;
  }
  return Array.isArray(row.items) ? row.items as CartLine[] : [];
}

export async function saveRecoverySession(db: ReadDatabase, token: string, items: CartLine[]): Promise<void> {
  await db.query(
    `INSERT INTO cart_sessions (token_hash, items, expires_at)
     VALUES ($1, $2::jsonb, now() + ($3 || ' days')::interval)
     ON CONFLICT (token_hash) DO UPDATE
       SET items = EXCLUDED.items, expires_at = EXCLUDED.expires_at, updated_at = now()`,
    [hashCartToken(token), JSON.stringify(items), String(SESSION_DAYS)],
  );
}

export function mergeMigrationCartItems(
  kind: CartKind,
  typedLocal: unknown,
  migrated: CartLine[],
): { items: CartLine[]; unmappedItems: CartLine[] } {
  const items: CartLine[] = [];
  const unmappedItems: CartLine[] = [];
  const seen = new Set<string>();
  const candidates = [...(Array.isArray(typedLocal) ? typedLocal : []), ...migrated];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const line = candidate as CartLine;
    if (!belongsToCart(kind, line)) {
      unmappedItems.push(line);
      continue;
    }
    const key = JSON.stringify([line.itemType, line.itemId ?? line.productId ?? line.slug ?? line.name, line.variantId ?? ""]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (items.length < MAX_CART_LINES) items.push(sanitizeCartItems([line])[0]);
    else unmappedItems.push(line);
  }
  return { items, unmappedItems };
}

export type CartMigrationInput = {
  legacyToken: string | null;
  bizonToken: string;
  shopToken: string;
  legacyCookieItems: unknown;
  legacyStorageItems: unknown;
  typedBizonItems: unknown;
  typedShopItems: unknown;
};

export async function migrateCartSessions(
  database: { transaction<T>(run: (query: ReadDatabase["query"]) => Promise<T>): Promise<T> },
  input: CartMigrationInput,
): Promise<{ bizonItems: CartLine[]; shopItems: CartLine[]; unmappedItems: CartLine[] }> {
  return database.transaction(async (query) => {
    const db: ReadDatabase = { query };
    await query("SELECT pg_advisory_xact_lock(hashtext($1))", [input.legacyToken ?? input.bizonToken]);
    const oldItems = input.legacyToken ? await readCartSession(db, input.legacyToken) : null;
    const existingBizon = await readCartSession(db, input.bizonToken);
    const existingShop = await readCartSession(db, input.shopToken);
    const recoveryToken = recoveryCartToken(input.bizonToken);
    const existingRecovery = await readRecoverySession(db, recoveryToken);
    const cookieItems = Array.isArray(input.legacyCookieItems) ? input.legacyCookieItems : [];
    const localItems = Array.isArray(input.legacyStorageItems) ? input.legacyStorageItems : [];
    const source = oldItems ?? (cookieItems.length ? cookieItems : localItems);
    const split = splitLegacyCartItems(source);
    const alreadyMigrated = existingRecovery !== null;
    const bizonMerged = alreadyMigrated
      ? { items: sanitizeTypedCartItems("bizon", existingBizon), unmappedItems: [] }
      : mergeMigrationCartItems("bizon", existingBizon ?? input.typedBizonItems, split.bizonItems);
    const shopMerged = alreadyMigrated
      ? { items: sanitizeTypedCartItems("shop", existingShop), unmappedItems: [] }
      : mergeMigrationCartItems("shop", existingShop ?? input.typedShopItems, split.shopItems);
    const bizonItems = bizonMerged.items;
    const shopItems = shopMerged.items;
    const unmappedItems = existingRecovery ?? [...split.unmappedItems, ...bizonMerged.unmappedItems, ...shopMerged.unmappedItems];
    if (!alreadyMigrated) {
      await saveCartSession(db, input.bizonToken, bizonItems);
      await saveCartSession(db, input.shopToken, shopItems);
      await saveRecoverySession(db, recoveryToken, unmappedItems);
    }
    if (input.legacyToken && oldItems !== null) await deleteCartSession(db, input.legacyToken);
    return { bizonItems, shopItems, unmappedItems };
  });
}
