import "server-only";
import type { AuditLogger } from "@/server/ports/audit-logger";

export function makeNoopAuditLogger(): AuditLogger {
  return {
    async record() {
      // E2E mock mode: no database, nothing to record.
    },
  };
}
