import { NextRequest } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window counters kept in process memory.
 *
 * This is deliberately dependency-free, which also bounds what it can promise:
 * each serverless instance keeps its own map, and a cold start clears it. It
 * throttles a burst against one instance, it is not a cluster-wide guarantee.
 * Move the store to Redis or Postgres if that guarantee is needed.
 */
const buckets = new Map<string, Bucket>();

/** Drop expired buckets so a long-lived instance cannot grow without bound. */
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. Always at least 1 when blocked. */
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > 10_000) sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > limit) {
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, limit, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Best-effort client address.
 *
 * x-forwarded-for is only trustworthy behind a proxy that overwrites it, which
 * is the case on Vercel. Self-hosting behind something that forwards the header
 * unchanged lets a caller spoof it, so the reverse proxy must set it.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
