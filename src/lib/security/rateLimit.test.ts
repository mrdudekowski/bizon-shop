import { afterEach, describe, expect, it } from "vitest";

import { checkRateLimit, resetRateLimitsForTests } from "./rateLimit";

afterEach(() => {
  resetRateLimitsForTests();
  delete process.env.API_RATE_LIMIT_DISABLED;
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    expect(checkRateLimit("test:1", { max: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit("test:1", { max: 2, windowMs: 60_000 }).allowed).toBe(true);
  });

  it("blocks when limit exceeded", () => {
    checkRateLimit("test:2", { max: 1, windowMs: 60_000 });
    const blocked = checkRateLimit("test:2", { max: 1, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    if (blocked.allowed === false) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it("isolates keys", () => {
    checkRateLimit("a", { max: 1, windowMs: 60_000 });
    expect(checkRateLimit("b", { max: 1, windowMs: 60_000 }).allowed).toBe(true);
  });

  it("can be disabled via env", () => {
    process.env.API_RATE_LIMIT_DISABLED = "1";
    checkRateLimit("x", { max: 1, windowMs: 60_000 });
    expect(checkRateLimit("x", { max: 1, windowMs: 60_000 }).allowed).toBe(true);
  });
});
