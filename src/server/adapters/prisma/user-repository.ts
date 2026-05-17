import type { PrismaClient } from "@prisma/client";

import "server-only";
import type { UserRecord, UserRepository } from "@/server/ports/user-repository";

function toUserRecord(
  row: { id: string; email: string | null; stripeCustomerId: string | null } | null,
): UserRecord | null {
  if (!row) return null;
  return { id: row.id, email: row.email, stripeCustomerId: row.stripeCustomerId };
}

export function makePrismaUserRepository(prisma: PrismaClient): UserRepository {
  return {
    async findById(id) {
      const row = await prisma.user.findUnique({ where: { id } });
      return toUserRecord(row);
    },
    async findByStripeCustomerId(customerId) {
      const row = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      return toUserRecord(row);
    },
    async setStripeCustomerId(id, customerId) {
      await prisma.user.update({ where: { id }, data: { stripeCustomerId: customerId } });
    },
  };
}
