import type Stripe from "stripe";

import type { UserRepository } from "@/server/ports/user-repository";
import type {
  SubscriptionRepository,
  SubscriptionUpsertInput,
} from "@/server/ports/subscription-repository";

export interface StripeWebhookService {
  handleEvent(event: Stripe.Event): Promise<void>;
}

type Deps = {
  subscriptions: SubscriptionRepository;
  users: UserRepository;
  retrieveSubscription: (id: string) => Promise<Stripe.Subscription>;
};

export function makeStripeWebhookService(deps: Deps): StripeWebhookService {
  const { subscriptions, users, retrieveSubscription } = deps;

  async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
    const metadataId = subscription.metadata?.userId;
    if (metadataId) return metadataId;
    const customer = subscription.customer;
    const customerId = typeof customer === "string" ? customer : customer.id;
    const user = await users.findByStripeCustomerId(customerId);
    return user?.id ?? null;
  }

  async function upsert(subscription: Stripe.Subscription): Promise<void> {
    const userId = await resolveUserId(subscription);
    if (!userId) return;

    const firstItem = subscription.items.data[0];
    // Stripe API 22+: current_period_end moved from Subscription to SubscriptionItem.
    const periodEnd = firstItem?.current_period_end ?? null;

    const input: SubscriptionUpsertInput = {
      userId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId: firstItem?.price.id ?? null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
    await subscriptions.upsertFromStripe(input);
  }

  return {
    async handleEvent(event) {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (!session.subscription) return;
          const id =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await retrieveSubscription(id);
          await upsert(subscription);
          return;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await upsert(event.data.object);
          return;
        case "invoice.payment_failed": {
          const invoice = event.data.object;
          console.warn("Payment failed", { invoiceId: invoice.id });
          return;
        }
      }
    },
  };
}
