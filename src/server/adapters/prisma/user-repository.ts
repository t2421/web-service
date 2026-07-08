import type { PrismaClient } from "@prisma/client";

import "server-only";
import type { UserRecord, UserRepository } from "@/server/ports/user-repository";

export function makePrismaUserRepository(prisma: PrismaClient): UserRepository {
  return {
    async findById(id) {
      const row = await prisma.user.findUnique({ where: { id } });
      if (!row) return null;
      const user: UserRecord = {
        id: row.id,
        name: row.name,
        email: row.email,
        stripeCustomerId: row.stripeCustomerId,
      };
      return user;
    },
    async updateName(id, name) {
      await prisma.user.update({ where: { id }, data: { name } });
    },
    async setStripeCustomerId(id, customerId) {
      await prisma.user.update({ where: { id }, data: { stripeCustomerId: customerId } });
    },
    async deleteById(id) {
      // accounts / subscriptions / authenticators は onDelete: Cascade で同時削除される
      await prisma.user.delete({ where: { id } });
    },
  };
}
