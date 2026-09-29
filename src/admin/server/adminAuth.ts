import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AdminSession, EditorCapability } from "../domain/types";

export type Query = (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export type AuthenticatedAccount = {
  id: string;
  login: string;
  role: AdminSession["role"];
  capabilities: EditorCapability[];
};

export function parseCapabilities(value: unknown): EditorCapability[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is EditorCapability => item === "create_catalog_items" || item === "edit_site_pages");
}

export const SESSION_COOKIE_NAME = "bizon-cms-session";

const SESSION_TTL_SECONDS = 12 * 60 * 60;
const SCRYPT_KEY_LENGTH = 64;

/**
 * The users table still holds hashes written by the previous CMS in the same column,
 * and the two formats are indistinguishable byte strings. Tagging ours keeps an old
 * hash from ever being fed to scrypt and accidentally accepted.
 */
const HASH_TAG = "scrypt";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `${HASH_TAG}$${salt}$${key}`;
}

export function verifyPassword(password: string, encoded: string | null | undefined): boolean {
  const [tag, salt, key] = (encoded ?? "").split("$");
  if (tag !== HASH_TAG || !salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  if (expected.length !== SCRYPT_KEY_LENGTH) return false;

  return timingSafeEqual(expected, scryptSync(password, salt, SCRYPT_KEY_LENGTH));
}

export function readSessionCookie(header: string | undefined): string | null {
  for (const part of (header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== SESSION_COOKIE_NAME) continue;
    const token = decodeURIComponent(part.slice(separator + 1).trim());
    return token === "" ? null : token;
  }
  return null;
}

export function sessionCookie(token: string, secure: boolean): string {
  return cookie(token, SESSION_TTL_SECONDS, secure);
}

export function clearedSessionCookie(secure: boolean): string {
  return cookie("", 0, secure);
}

function cookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function sessionRole(storedValue: unknown): AdminSession["role"] {
  return String(storedValue) === "admin" ? "admin" : "editor";
}

export function storedRole(role: AdminSession["role"]): "admin" | "content_manager" {
  return role === "admin" ? "admin" : "content_manager";
}

export async function ensureAuthSchema(query: Query): Promise<void> {
  await query(`CREATE TABLE IF NOT EXISTS cms_auth_sessions (
    token_hash char(64) PRIMARY KEY,
    user_id bigint NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await query(`CREATE INDEX IF NOT EXISTS cms_auth_sessions_user_expiry_idx
    ON cms_auth_sessions (user_id, expires_at)`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS cms_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb`);
  await query(`CREATE TABLE IF NOT EXISTS cms_change_sets (
    id text PRIMARY KEY,
    pack jsonb NOT NULL
  )`);
}

export type BootstrapEnv = Record<string, string | undefined>;

/**
 * Creates the configured accounts on first start. An account that already has a
 * password keeps it, so editing the environment can never take over an existing login.
 */
export async function bootstrapAccounts(query: Query, env: BootstrapEnv): Promise<void> {
  await ensureAccount(query, env.CMS_BOOTSTRAP_ADMIN_LOGIN, env.CMS_BOOTSTRAP_ADMIN_PASSWORD, "admin");
  await ensureAccount(query, env.CMS_BOOTSTRAP_EDITOR_LOGIN, env.CMS_BOOTSTRAP_EDITOR_PASSWORD, "editor");
}

async function ensureAccount(
  query: Query,
  login: string | undefined,
  password: string | undefined,
  role: AdminSession["role"],
): Promise<void> {
  const name = login?.trim();
  if (!name || !password) return;

  const rows = await query("SELECT id, hash FROM users WHERE email = $1", [name]);
  if (rows.length === 0) {
    await query(
      `INSERT INTO users (name, email, role, status, hash, created_at, updated_at)
       VALUES ($1, $1, $2, 'active', $3, now(), now())`,
      [name, storedRole(role), hashPassword(password)],
    );
    return;
  }

  const stored = rows[0].hash;
  if (stored == null || String(stored) === "") {
    await query("UPDATE users SET hash = $2, updated_at = now() WHERE id = $1", [
      rows[0].id,
      hashPassword(password),
    ]);
  }
}

export async function authenticate(
  query: Query,
  login: string,
  password: string,
): Promise<AuthenticatedAccount | null> {
  const rows = await query("SELECT id, email, role, status, hash, cms_capabilities FROM users WHERE email = $1", [
    login.trim(),
  ]);
  const row = rows[0];
  if (row == null || String(row.status) !== "active") return null;
  if (!verifyPassword(password, row.hash == null ? null : String(row.hash))) return null;

  return {
    id: String(row.id),
    login: String(row.email),
    role: sessionRole(row.role),
    capabilities: parseCapabilities(row.cms_capabilities),
  };
}

export async function startSession(query: Query, userId: string, now = new Date()): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  await query(
    "INSERT INTO cms_auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [tokenHash(token), Number(userId), expiresAt.toISOString()],
  );
  return token;
}

export async function readSession(
  query: Query,
  token: string,
  now = new Date(),
): Promise<AuthenticatedAccount | null> {
  const rows = await query(
    `SELECT u.id, u.email, u.role, u.status, u.cms_capabilities
     FROM cms_auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [tokenHash(token), now.toISOString()],
  );
  const row = rows[0];
  if (row == null || String(row.status) !== "active") return null;

  return {
    id: String(row.id),
    login: String(row.email),
    role: sessionRole(row.role),
    capabilities: parseCapabilities(row.cms_capabilities),
  };
}

export async function endSession(query: Query, token: string): Promise<void> {
  await query("DELETE FROM cms_auth_sessions WHERE token_hash = $1", [tokenHash(token)]);
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
