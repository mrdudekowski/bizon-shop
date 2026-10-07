import { describe, expect, it } from "vitest";
import { passwordResetHistoryMigration } from "./0007-password-reset-history";

describe("password reset history migration", () => {
  it("stores who reset whose password and when, without storing a password", () => {
    expect(passwordResetHistoryMigration.version).toBe("202610060007");
    expect(passwordResetHistoryMigration.sql).toContain("CREATE TABLE IF NOT EXISTS cms_password_reset_history");
    expect(passwordResetHistoryMigration.sql).toContain("actor_login text NOT NULL");
    expect(passwordResetHistoryMigration.sql).toContain("target_login text NOT NULL");
    expect(passwordResetHistoryMigration.sql).toContain("created_at timestamptz NOT NULL DEFAULT now()");
    expect(passwordResetHistoryMigration.sql).not.toMatch(/\bpassword\s+text\b/i);
    expect(passwordResetHistoryMigration.sql).not.toMatch(/\bhash\s+text\b/i);
  });
});
