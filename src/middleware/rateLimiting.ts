/**
 * Simple per-IP sliding-window rate limiter for /api/* routes.
 *
 * This is defense-in-depth only — the primary rate limiting is expected to
 * happen upstream at Caddy (caddy-ratelimit) or the Cloudflare edge before
 * traffic ever reaches this process. See docs/DEPLOYMENT.md.
 */

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly options: RateLimiterOptions) {}

  /** Returns true if the request from `ip` should be allowed. */
  allow(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    const existing = this.hits.get(ip) ?? [];
    const recent = existing.filter((t) => t > windowStart);
    recent.push(now);
    this.hits.set(ip, recent);

    if (recent.length > this.options.maxRequests) {
      return false;
    }
    return true;
  }

  /** Periodic cleanup to prevent unbounded memory growth. */
  sweep(): void {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    for (const [ip, timestamps] of this.hits) {
      const recent = timestamps.filter((t) => t > windowStart);
      if (recent.length === 0) {
        this.hits.delete(ip);
      } else {
        this.hits.set(ip, recent);
      }
    }
  }
}

export const defaultRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 120 });
