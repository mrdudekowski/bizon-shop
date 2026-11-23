import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("pg", () => ({
  Pool: class {
    query(...args: unknown[]) {
      return mocks.query(...args);
    }
  },
}));

import { createPostgresAdminClient } from "./postgresAdmin";

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.query.mockReset();
});

describe("countNewRequests", () => {
  it("returns the database count of all requests in the new status", async () => {
    vi.stubEnv("DATABASE_URI", "postgres://test.invalid/bizon");
    mocks.query.mockResolvedValue({ rows: [{ count: 203 }] });
    const client = createPostgresAdminClient({ id: "1", login: "admin", role: "admin", capabilities: [] });

    await expect(client.countNewRequests()).resolves.toBe(203);

    expect(mocks.query).toHaveBeenCalledWith(
      "SELECT COUNT(*)::int AS count FROM requests WHERE status = 'new'",
      [],
    );
  });
});
