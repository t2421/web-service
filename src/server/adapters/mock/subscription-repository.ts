import "server-only";
import { readMockUser } from "@/server/adapters/mock/cookie-helpers";
import type { Subscription } from "@/server/domain/billing";
import { SESSION_MAX_AGE_MS } from "@/server/domain/constants";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";

const MOCK_PERIOD_MS = 30 * SESSION_MAX_AGE_MS;

export function makeMockSubscriptionRepository(): SubscriptionRepository {
  return {
    async findByUserId() {
      const user = await readMockUser();
      if (!user || user.subscription !== "active") return null;
      const subscription: Subscription = {
        status: "active",
        priceId: "price_mock_pro_monthly",
        currentPeriodEnd: new Date(Date.now() + MOCK_PERIOD_MS),
      };
      return subscription;
    },

    // Mock mode persists subscription state via the auth cookie; Stripe webhook
    // events are not exercised in E2E, so this is a no-op.
    async upsertFromStripe() {
      // intentional no-op
    },
  };
}
