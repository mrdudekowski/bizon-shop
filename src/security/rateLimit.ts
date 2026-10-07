export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string): RateLimitResult {
  const disabled = process.env.API_RATE_LIMIT_DISABLED === "1";
  if (disabled) return { allowed: true };

  const parsedMax = Number.parseInt(process.env.API_RATE_LIMIT_MAX ?? "30", 10);
  const parsedWindow = Number.parseInt(process.env.API_RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 30;
  const windowMs = Number.isFinite(parsedWindow) && parsedWindow > 0 ? parsedWindow : 60_000;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (bucket.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { allowed: true };
}

export function trustedClientAddress(remoteAddress: string | undefined, forwardedFor: string | undefined): string {
  const fallback = remoteAddress?.replace(/^::ffff:/, "") || "unknown";
  const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "0", 10);
  if (!Number.isSafeInteger(hops) || hops <= 0 || !forwardedFor) return fallback;
  const chain = forwardedFor.split(",").map((part) => part.trim()).filter(Boolean);
  return chain.length >= hops ? chain[chain.length - hops] ?? fallback : fallback;
}
