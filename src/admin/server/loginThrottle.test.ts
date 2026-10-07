import { describe, expect, it } from "vitest";
import { LoginThrottle } from "./loginThrottle";

describe("login throttle", () => {
  it("blocks additional failed attempts until the window expires", () => {
    const throttle = new LoginThrottle({ maxAttempts: 2, windowMs: 60_000 });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = throttle.begin("editor@example.test", 1_000);
      expect(result.allowed).toBe(true);
      if (result.allowed) throttle.finish(result.ticket, "failed", 1_000);
    }

    expect(throttle.begin("editor@example.test", 1_001)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(throttle.begin("editor@example.test", 61_000).allowed).toBe(true);
  });

  it("counts concurrent attempts before authentication finishes", () => {
    const throttle = new LoginThrottle({ maxAttempts: 2, windowMs: 60_000 });
    const first = throttle.begin("editor@example.test", 1_000);
    const second = throttle.begin("editor@example.test", 1_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(throttle.begin("editor@example.test", 1_000).allowed).toBe(false);

    if (first.allowed) throttle.finish(first.ticket, "aborted", 1_000);
    expect(throttle.begin("editor@example.test", 1_000).allowed).toBe(true);
  });

  it("treats login case and surrounding spaces as the same account", () => {
    const throttle = new LoginThrottle({ maxAttempts: 1, windowMs: 60_000 });
    const first = throttle.begin("Editor@example.test", 1_000);
    if (first.allowed) throttle.finish(first.ticket, "failed", 1_000);

    expect(throttle.begin(" editor@example.test ", 1_001).allowed).toBe(false);
  });

  it("clears failures after a successful login", () => {
    const throttle = new LoginThrottle({ maxAttempts: 2, windowMs: 60_000 });
    const failed = throttle.begin("editor@example.test", 1_000);
    if (failed.allowed) throttle.finish(failed.ticket, "failed", 1_000);
    const successful = throttle.begin("editor@example.test", 1_001);
    if (successful.allowed) throttle.finish(successful.ticket, "succeeded", 1_001);

    expect(throttle.begin("editor@example.test", 1_002).allowed).toBe(true);
  });
});
