export interface RateLimiter {
  limit(key: string): Promise<{ success: boolean }>;
}
