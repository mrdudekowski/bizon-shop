import { afterEach, describe, expect, it, vi } from "vitest";

import { createRateLimiter } from "./rateLimit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("request rate limiter", () => {
  it("limits repeated requests for one client until the window expires", () => {
    vi.stubEnv("API_RATE_LIMIT_MAX", "2");
    vi.stubEnv("API_RATE_LIMIT_WINDOW_MS", "1000");
    const limit = createRateLimiter();

    expect(limit("client-a", 0)).toEqual({ allowed: true });
    expect(limit("client-a", 1)).toEqual({ allowed: true });
    expect(limit("client-a", 2)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(limit("client-a", 1000)).toEqual({ allowed: true });
  });

  it("bounds tracked client keys and recovers capacity after the window expires", () => {
    vi.stubEnv("API_RATE_LIMIT_MAX", "1");
    vi.stubEnv("API_RATE_LIMIT_WINDOW_MS", "1000");
    const limit = createRateLimiter({ maxTrackedKeys: 2 });

    expect(limit("client-a", 0)).toEqual({ allowed: true });
    expect(limit("client-b", 0)).toEqual({ allowed: true });
    expect(limit("client-c", 0)).toEqual({ allowed: false, retryAfterSeconds: 1 });
    expect(limit("client-c", 1000)).toEqual({ allowed: true });
  });
});
