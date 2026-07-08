import type { PrismaClient, SubscriptionStatus as PrismaStatus } from "@prisma/client";

import "server-only";
import type { Subscription, SubscriptionStatus } from "@/server/domain/billing";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";

const STATUS_MAP: Record<PrismaStatus, SubscriptionStatus> = {
  active: "active",
  trialing: "trialing",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete_expired",
  past_due: "past_due",
  paused: "paused",
  unpaid: "unpaid",
};

export function makePrismaSubscriptionRepository(prisma: PrismaClient): SubscriptionRepository {
  return {
    async findByUserId(userId) {
      const row = await prisma.subscription.findUnique({ where: { userId } });
      if (!row) return null;
      const subscription: Subscription = {
        stripeSubscriptionId: row.stripeSubscriptionId,
        status: STATUS_MAP[row.status],
        priceId: row.priceId,
        currentPeriodEnd: row.currentPeriodEnd,
      };
      return subscription;
    },
  };
}
