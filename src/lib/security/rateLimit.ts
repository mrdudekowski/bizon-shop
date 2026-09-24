/**
 * ponytail: in-memory fixed window per key; single-process ceiling; use Redis if horizontally scaled.
 */

export type RateLimitOptions = {
  max?: number;
  windowMs?: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function readLimitConfig(): Required<RateLimitOptions> {
  const disabled = process.env.API_RATE_LIMIT_DISABLED === "1";
  if (disabled) {
    return { max: Number.MAX_SAFE_INTEGER, windowMs: 60_000 };
  }

  const max = Number.parseInt(process.env.API_RATE_LIMIT_MAX ?? "30", 10);
  const windowMs = Number.parseInt(process.env.API_RATE_LIMIT_WINDOW_MS ?? "60000", 10);

  return {
    max: Number.isFinite(max) && max > 0 ? max : 30,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
  };
}

export function checkRateLimit(key: string, options?: RateLimitOptions): RateLimitResult {
  const base = readLimitConfig();
  const disabled = process.env.API_RATE_LIMIT_DISABLED === "1";
  const max = disabled ? base.max : (options?.max ?? base.max);
  const windowMs = options?.windowMs ?? base.windowMs;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Test helper — clears in-memory state. */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}

export function rateLimitKeyFromRequest(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
