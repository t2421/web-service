import "server-only";
import { createRateLimiter } from "@/lib/redis";
import type { RateLimiter } from "@/server/ports/rate-limiter";

type Window = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

export function makeUpstashRateLimiter(opts: {
  requests: number;
  window: Window;
  prefix: string;
}): RateLimiter {
  const inner = createRateLimiter(opts);
  return {
    async limit(key) {
      const result = await inner.limit(key);
      return { success: result.success };
    },
  };
}
