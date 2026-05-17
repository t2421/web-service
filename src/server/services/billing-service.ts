import type { Plan, Subscription } from "@/server/domain/billing";
import { NotFoundError, UnauthorizedError } from "@/server/domain/errors";
import type { BillingGateway } from "@/server/ports/billing-gateway";
import type { SessionGateway } from "@/server/ports/session-gateway";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";
import type { UserRepository } from "@/server/ports/user-repository";

export interface BillingService {
  getCurrentSubscription(): Promise<Subscription | null>;
  startCheckout(input: { plan: Plan }): Promise<{ url: string }>;
  openBillingPortal(): Promise<{ url: string }>;
}

export function makeBillingService(deps: {
  sessions: SessionGateway;
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  billing: BillingGateway;
}): BillingService {
  const { sessions, users, subscriptions, billing } = deps;

  return {
    async getCurrentSubscription() {
      const session = await sessions.getSession();
      if (!session) return null;
      return subscriptions.findByUserId(session.user.id);
    },

    async startCheckout({ plan }) {
      const session = await sessions.getSession();
      if (!session?.user?.id || !session.user.email) throw new UnauthorizedError();

      const user = await users.findById(session.user.id);
      const result = await billing.createCheckoutUrl({
        userId: session.user.id,
        email: session.user.email,
        plan,
        existingCustomerId: user?.stripeCustomerId ?? null,
        successPath: "/billing?status=success",
        cancelPath: "/billing?status=canceled",
      });

      if (result.customerId && user?.stripeCustomerId !== result.customerId) {
        await users.setStripeCustomerId(session.user.id, result.customerId);
      }
      return { url: result.url };
    },

    async openBillingPortal() {
      const session = await sessions.getSession();
      if (!session?.user?.id) throw new UnauthorizedError();
      const user = await users.findById(session.user.id);
      if (!user?.stripeCustomerId) throw new NotFoundError("Stripe customer");
      return billing.createPortalUrl({
        customerId: user.stripeCustomerId,
        returnPath: "/billing",
      });
    },
  };
}
