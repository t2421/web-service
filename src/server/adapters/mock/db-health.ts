import type { DbHealthCheck } from "@/server/ports/db-health";

export function makeMockDbHealthCheck(): DbHealthCheck {
  return {
    async ping() {
      return { ok: true };
    },
  };
}
