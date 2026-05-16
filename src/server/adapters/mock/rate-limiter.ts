import type { RateLimiter } from "@/server/ports/rate-limiter";

export function makeNoopRateLimiter(): RateLimiter {
  return {
    async limit() {
      return { success: true };
    },
  };
}
