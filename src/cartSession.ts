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
