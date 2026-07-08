import type { PrismaClient } from "@prisma/client";

import "server-only";
import { logger } from "@/lib/logger";
import type { AuditLogger } from "@/server/ports/audit-logger";

export function makePrismaAuditLogger(prisma: PrismaClient): AuditLogger {
  return {
    async record({ userId, action, metadata }) {
      try {
        await prisma.auditLog.create({
          data: { userId, action, metadata: metadata ?? undefined },
        });
      } catch (error) {
        // 監査ログの書き込み失敗で業務処理を落とさない。ログには残す。
        logger.error("audit log write failed", { action, userId, error: String(error) });
      }
    },
  };
}
