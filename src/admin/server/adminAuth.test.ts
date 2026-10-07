import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_NAME,
  authenticate,
  bootstrapAccounts,
  clearedSessionCookie,
  endSession,
  hashPassword,
  readSession,
  readSessionCookie,
  resetUserPassword,
  sessionCookie,
  sessionRole,
  startSession,
  storedRole,
  verifyPassword,
  type Query,
} from "./adminAuth";

type Call = { sql: string; params: unknown[] };

function recordingQuery(responses: Record<string, Record<string, unknown>[]>): {
  query: Query;
  calls: Call[];
} {
  const calls: Call[] = [];
  const query: Query = async (sql, params = []) => {
    calls.push({ sql, params });
    const match = Object.keys(responses).find((fragment) => sql.includes(fragment));
    return match == null ? [] : responses[match];
  };
  return { query, calls };
}

describe("password hashing", () => {
  it("accepts the original password and rejects a wrong one", () => {
    const encoded = hashPassword("correct horse");

    expect(verifyPassword("correct horse", encoded)).toBe(true);
    expect(verifyPassword("wrong horse", encoded)).toBe(false);
  });

  it("produces a different hash for the same password", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("rejects a hash left by the previous CMS instead of guessing its format", () => {
    expect(verifyPassword("anything", "b1946ac92492d2347c6235b4d2611184")).toBe(false);
    expect(verifyPassword("anything", null)).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});

describe("administrator password reset", () => {
  it("changes another account password, ends its sessions and stores an audit entry without the password", async () => {
    const newPassword = "a-new-long-password";
    const { query, calls } = recordingQuery({
      "SELECT id, email FROM users": [{ id: 18, email: "editor@example.test" }],
    });

    await resetUserPassword(query, { id: "7", login: "admin@example.test" }, "18", newPassword);

    const update = calls.find((call) => call.sql.includes("UPDATE users SET hash"));
    const revoke = calls.find((call) => call.sql.includes("DELETE FROM cms_auth_sessions"));
    const audit = calls.find((call) => call.sql.includes("INSERT INTO cms_password_reset_history"));
    expect(update?.params[0]).toBe(18);
    expect(verifyPassword(newPassword, String(update?.params[1]))).toBe(true);
    expect(revoke?.params).toEqual([18]);
    expect(audit?.params).toEqual([7, "admin@example.test", 18, "editor@example.test"]);
    expect(JSON.stringify(audit?.params)).not.toContain(newPassword);
  });

  it("does not allow an administrator to reset their own password here", async () => {
    const { query, calls } = recordingQuery({});

    await expect(
      resetUserPassword(query, { id: "7", login: "admin@example.test" }, "7", "a-new-long-password"),
    ).rejects.toMatchObject({ code: "cannot_reset_self" });
    expect(calls).toHaveLength(0);
  });

  it("does not allow an alternate numeric format to bypass the self-reset check", async () => {
    const { query, calls } = recordingQuery({});

    await expect(
      resetUserPassword(query, { id: "7", login: "admin@example.test" }, "007", "a-new-long-password"),
    ).rejects.toMatchObject({ code: "cannot_reset_self" });
    expect(calls).toHaveLength(0);
  });

  it("requires at least 12 characters before querying the account", async () => {
    const { query, calls } = recordingQuery({});

    await expect(
      resetUserPassword(query, { id: "7", login: "admin@example.test" }, "18", "short"),
    ).rejects.toMatchObject({ code: "password_too_short" });
    expect(calls).toHaveLength(0);
  });
});

describe("session cookie", () => {
  it("reads the token out of a header holding several cookies", () => {
    const header = `other=1; ${SESSION_COOKIE_NAME}=abc123; last=2`;

    expect(readSessionCookie(header)).toBe("abc123");
    expect(readSessionCookie("other=1")).toBeNull();
    expect(readSessionCookie(undefined)).toBeNull();
  });

  it("keeps the token out of scripts and off cross-site requests", () => {
    const cookie = sessionCookie("abc123", false);

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain("Secure");
    expect(sessionCookie("abc123", true)).toContain("Secure");
  });

  it("expires the cookie immediately on logout", () => {
    expect(clearedSessionCookie(false)).toContain("Max-Age=0");
  });

  it("sets the browser session to expire after 12 hours", () => {
    expect(sessionCookie("abc123", false)).toContain("Max-Age=43200");
  });
});

describe("roles", () => {
  it("maps stored roles onto the two roles the CMS knows", () => {
    expect(sessionRole("admin")).toBe("admin");
    expect(sessionRole("content_manager")).toBe("editor");
    expect(sessionRole("editor")).toBe("editor");
    expect(sessionRole("viewer")).toBeNull();
    expect(storedRole("admin")).toBe("admin");
    expect(storedRole("editor")).toBe("content_manager");
  });
});

describe("bootstrap", () => {
  it("creates a missing account with a hash", async () => {
    const { query, calls } = recordingQuery({});

    await bootstrapAccounts(query, {
      CMS_BOOTSTRAP_ADMIN_LOGIN: "chief",
      CMS_BOOTSTRAP_ADMIN_PASSWORD: "secret",
    });

    const insert = calls.find((call) => call.sql.includes("INSERT INTO users"));
    expect(insert).toBeDefined();
    expect(insert?.params[0]).toBe("chief");
    expect(insert?.params).not.toContain("secret");
  });

  it("fills a hash for an account that has none", async () => {
    const { query, calls } = recordingQuery({
      "SELECT id, hash FROM users": [{ id: 2, hash: null }],
    });

    await bootstrapAccounts(query, {
      CMS_BOOTSTRAP_ADMIN_LOGIN: "chief",
      CMS_BOOTSTRAP_ADMIN_PASSWORD: "secret",
    });

    expect(calls.some((call) => call.sql.includes("UPDATE users SET hash"))).toBe(true);
  });

  it("does not recreate a missing bootstrap login when other users already exist", async () => {
    const { query, calls } = recordingQuery({
      "SELECT id FROM users LIMIT 1": [{ id: 7 }],
    });

    await bootstrapAccounts(query, {
      CMS_BOOTSTRAP_ADMIN_LOGIN: "removed-admin",
      CMS_BOOTSTRAP_ADMIN_PASSWORD: "old-bootstrap-password",
    });

    expect(calls.some((call) => call.sql.includes("INSERT INTO users"))).toBe(false);
  });

  it("never overwrites a password that already exists", async () => {
    const { query, calls } = recordingQuery({
      "SELECT id, hash FROM users": [{ id: 2, hash: hashPassword("chosen by the owner") }],
    });

    await bootstrapAccounts(query, {
      CMS_BOOTSTRAP_ADMIN_LOGIN: "chief",
      CMS_BOOTSTRAP_ADMIN_PASSWORD: "something else",
    });

    expect(calls.some((call) => call.sql.includes("UPDATE users"))).toBe(false);
  });

  it("does nothing when the variables are not configured", async () => {
    const { query, calls } = recordingQuery({});

    await bootstrapAccounts(query, {});

    expect(calls).toHaveLength(0);
  });
});

describe("authenticate", () => {
  const encoded = hashPassword("right");

  it("returns the account for the right password", async () => {
    const { query } = recordingQuery({
      "FROM users WHERE email": [
        { id: 7, email: "chief", role: "admin", status: "active", hash: encoded },
      ],
    });

    await expect(authenticate(query, "chief", "right")).resolves.toEqual({
      id: "7",
      login: "chief",
      role: "admin",
      capabilities: [],
    });
  });

  it("returns editor capabilities from the user row", async () => {
    const { query } = recordingQuery({
      "FROM users WHERE email": [
        {
          id: 8,
          email: "writer",
          role: "content_manager",
          status: "active",
          hash: encoded,
          cms_capabilities: ["create_catalog_items", "edit_site_pages"],
        },
      ],
    });

    await expect(authenticate(query, "writer", "right")).resolves.toEqual({
      id: "8",
      login: "writer",
      role: "editor",
      capabilities: ["create_catalog_items", "edit_site_pages"],
    });
  });

  it("refuses a wrong password, an unknown login and a disabled account", async () => {
    const active = recordingQuery({
      "FROM users WHERE email": [
        { id: 7, email: "chief", role: "admin", status: "active", hash: encoded },
      ],
    });
    const unknown = recordingQuery({});
    const disabled = recordingQuery({
      "FROM users WHERE email": [
        { id: 7, email: "chief", role: "admin", status: "inactive", hash: encoded },
      ],
    });
    const unsupportedRole = recordingQuery({
      "FROM users WHERE email": [
        { id: 9, email: "viewer", role: "viewer", status: "active", hash: encoded },
      ],
    });

    await expect(authenticate(active.query, "chief", "wrong")).resolves.toBeNull();
    await expect(authenticate(unknown.query, "ghost", "right")).resolves.toBeNull();
    await expect(authenticate(disabled.query, "chief", "right")).resolves.toBeNull();
    await expect(authenticate(unsupportedRole.query, "viewer", "right")).resolves.toBeNull();
  });
});

describe("startSession", () => {
  it("stores only a hash of the token it hands out", async () => {
    const { query, calls } = recordingQuery({});

    const token = await startSession(query, "7");

    const insert = calls.find((call) => call.sql.includes("INSERT INTO cms_auth_sessions"));
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(insert?.params).not.toContain(token);
    expect(String(insert?.params[0])).toHaveLength(64);
  });
});

describe("readSession", () => {
  const now = new Date("2026-10-06T00:00:00.000Z");

  it("requires an unexpired database session and reads the current user permissions", async () => {
    const token = "session-token";
    const { query, calls } = recordingQuery({
      "FROM cms_auth_sessions": [
        {
          id: 7,
          email: "writer",
          role: "content_manager",
          status: "active",
          cms_capabilities: ["edit_site_pages"],
        },
      ],
    });

    await expect(readSession(query, token, now)).resolves.toEqual({
      id: "7",
      login: "writer",
      role: "editor",
      capabilities: ["edit_site_pages"],
    });
    expect(calls[0].sql).toContain("s.expires_at > $2");
    expect(calls[0].params).toEqual([
      createHash("sha256").update(token).digest("hex"),
      now.toISOString(),
    ]);
  });

  it("rejects sessions for disabled users and unsupported roles", async () => {
    const disabled = recordingQuery({
      "FROM cms_auth_sessions": [
        { id: 7, email: "writer", role: "content_manager", status: "inactive" },
      ],
    });
    const unsupportedRole = recordingQuery({
      "FROM cms_auth_sessions": [
        { id: 7, email: "writer", role: "viewer", status: "active" },
      ],
    });
    const expired = recordingQuery({});

    await expect(readSession(disabled.query, "token", now)).resolves.toBeNull();
    await expect(readSession(unsupportedRole.query, "token", now)).resolves.toBeNull();
    await expect(readSession(expired.query, "token", now)).resolves.toBeNull();
  });

  it("removes only the hash of a logged-out token", async () => {
    const token = "session-token";
    const { query, calls } = recordingQuery({});

    await endSession(query, token);

    expect(calls[0].sql).toContain("DELETE FROM cms_auth_sessions WHERE token_hash = $1");
    expect(calls[0].params).toEqual([createHash("sha256").update(token).digest("hex")]);
    expect(calls[0].params).not.toContain(token);
  });
});
