import { cookies } from "next/headers";

import "server-only";
import { MOCK_SESSION_COOKIE, parseMockUser } from "@/lib/mock-mode";
import type { Subscription } from "@/server/domain/billing";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";

export function makeMockSubscriptionRepository(): SubscriptionRepository {
  return {
    async findByUserId() {
      const store = await cookies();
      const user = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value);
      if (!user || user.subscription !== "active") return null;
      const subscription: Subscription = {
        stripeSubscriptionId: "sub_mock",
        status: "active",
        priceId: "price_mock_pro_monthly",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      return subscription;
    },
  };
}
