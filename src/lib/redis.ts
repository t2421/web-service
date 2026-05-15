import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import "server-only";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  url && token
    ? new Redis({ url, token })
    : null;

export function createRateLimiter(opts?: {
  requests?: number;
  window?: `${number} ${"ms" | "s" | "m" | "h" | "d"}`;
  prefix?: string;
}) {
  if (!redis) {
    return {
      async limit(_key: string) {
        return { success: true, limit: 0, remaining: 0, reset: 0 };
      },
    };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(opts?.requests ?? 10, opts?.window ?? "10 s"),
    analytics: true,
    prefix: opts?.prefix ?? "ratelimit",
  });
}
