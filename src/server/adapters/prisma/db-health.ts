import type { PrismaClient } from "@prisma/client";

import "server-only";
import type { DbHealthCheck } from "@/server/ports/db-health";

export function makePrismaDbHealthCheck(prisma: PrismaClient): DbHealthCheck {
  return {
    async ping() {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },
  };
}
