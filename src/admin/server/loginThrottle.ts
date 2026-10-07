import { createHash } from "node:crypto";

// This in-process guard is an extra layer for the current single local backend.
// Production must also limit requests at its trusted network entry point.

type LoginThrottleOptions = {
  maxAttempts?: number;
  windowMs?: number;
  maxTrackedLogins?: number;
};

type Bucket = {
  windowStartedAt: number;
  failedAttempts: number;
  inFlight: number;
};

export type LoginAttemptTicket = {
  key: string;
  windowStartedAt: number;
};

export type LoginAttemptReservation =
  | { allowed: true; ticket: LoginAttemptTicket }
  | { allowed: false; retryAfterSeconds: number };

export class LoginThrottle {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly maxTrackedLogins: number;

  constructor(options: LoginThrottleOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 5;
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
    this.maxTrackedLogins = options.maxTrackedLogins ?? 4096;
  }

  begin(login: string, now = Date.now()): LoginAttemptReservation {
    const key = createHash("sha256").update(login.trim().toLowerCase()).digest("hex");
    let bucket = this.buckets.get(key);

    if (bucket && now - bucket.windowStartedAt >= this.windowMs) {
      this.buckets.delete(key);
      bucket = undefined;
    }

    if (!bucket) {
      this.pruneExpired(now);
      while (this.buckets.size >= this.maxTrackedLogins) {
        const oldestKey = this.buckets.keys().next().value as string | undefined;
        if (!oldestKey) break;
        this.buckets.delete(oldestKey);
      }
      bucket = { windowStartedAt: now, failedAttempts: 0, inFlight: 0 };
      this.buckets.set(key, bucket);
    } else {
      this.buckets.delete(key);
      this.buckets.set(key, bucket);
    }

    if (bucket.failedAttempts + bucket.inFlight >= this.maxAttempts) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.windowStartedAt + this.windowMs - now) / 1000),
        ),
      };
    }

    bucket.inFlight += 1;
    return { allowed: true, ticket: { key, windowStartedAt: bucket.windowStartedAt } };
  }

  finish(ticket: LoginAttemptTicket, outcome: "failed" | "succeeded" | "aborted", now = Date.now()): void {
    const bucket = this.buckets.get(ticket.key);
    if (!bucket || bucket.windowStartedAt !== ticket.windowStartedAt) return;
    if (now - bucket.windowStartedAt >= this.windowMs) {
      this.buckets.delete(ticket.key);
      return;
    }

    bucket.inFlight = Math.max(0, bucket.inFlight - 1);
    if (outcome === "failed") bucket.failedAttempts += 1;
    if (outcome === "succeeded") bucket.failedAttempts = 0;
    if (bucket.failedAttempts === 0 && bucket.inFlight === 0) this.buckets.delete(ticket.key);
  }

  private pruneExpired(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.windowStartedAt >= this.windowMs) this.buckets.delete(key);
    }
  }
}
