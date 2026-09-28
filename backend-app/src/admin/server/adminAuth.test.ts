import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_NAME,
  authenticate,
  bootstrapAccounts,
  clearedSessionCookie,
  hashPassword,
  readSessionCookie,
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
});

describe("roles", () => {
  it("maps stored roles onto the two roles the CMS knows", () => {
    expect(sessionRole("admin")).toBe("admin");
    expect(sessionRole("content_manager")).toBe("editor");
    expect(sessionRole("viewer")).toBe("editor");
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

    await expect(authenticate(active.query, "chief", "wrong")).resolves.toBeNull();
    await expect(authenticate(unknown.query, "ghost", "right")).resolves.toBeNull();
    await expect(authenticate(disabled.query, "chief", "right")).resolves.toBeNull();
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
