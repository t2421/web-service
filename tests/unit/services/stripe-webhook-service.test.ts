import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import type {
  SubscriptionRepository,
  SubscriptionUpsertInput,
} from "@/server/ports/subscription-repository";
import type { UserRecord, UserRepository } from "@/server/ports/user-repository";
import { makeStripeWebhookService } from "@/server/services/stripe-webhook-service";

function fakeSubscriptions() {
  const upserts: SubscriptionUpsertInput[] = [];
  const repo: SubscriptionRepository = {
    findByUserId: async () => null,
    upsertFromStripe: async (input) => {
      upserts.push(input);
    },
  };
  return { repo, upserts };
}

function fakeUsers(byCustomerId: Record<string, UserRecord>): UserRepository {
  return {
    findById: async () => null,
    findByStripeCustomerId: async (id) => byCustomerId[id] ?? null,
    setStripeCustomerId: async () => {},
  };
}

function buildSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_1",
    status: "active",
    customer: "cus_1",
    cancel_at_period_end: false,
    items: {
      data: [
        {
          price: { id: "price_pro" },
          current_period_end: 1_700_000_000,
        } as unknown as Stripe.SubscriptionItem,
      ],
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    metadata: {},
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("StripeWebhookService.handleEvent", () => {
  it("upserts using userId from subscription metadata when present", async () => {
    const { repo, upserts } = fakeSubscriptions();
    const service = makeStripeWebhookService({
      subscriptions: repo,
      users: fakeUsers({}),
      retrieveSubscription: async () => buildSubscription(),
    });

    const subscription = buildSubscription({ metadata: { userId: "user-meta" } });
    await service.handleEvent({
      type: "customer.subscription.updated",
      data: { object: subscription },
    } as unknown as Stripe.Event);

    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toMatchObject({
      userId: "user-meta",
      stripeSubscriptionId: "sub_1",
      status: "active",
      priceId: "price_pro",
      cancelAtPeriodEnd: false,
    });
    expect(upserts[0]!.currentPeriodEnd).toEqual(new Date(1_700_000_000 * 1000));
  });

  it("falls back to looking up the user by stripe customer id", async () => {
    const { repo, upserts } = fakeSubscriptions();
    const service = makeStripeWebhookService({
      subscriptions: repo,
      users: fakeUsers({
        cus_1: { id: "user-from-customer", email: null, stripeCustomerId: "cus_1" },
      }),
      retrieveSubscription: async () => buildSubscription(),
    });

    await service.handleEvent({
      type: "customer.subscription.created",
      data: { object: buildSubscription() },
    } as unknown as Stripe.Event);

    expect(upserts).toHaveLength(1);
    expect(upserts[0]!.userId).toBe("user-from-customer");
  });

  it("skips upsert when no userId can be resolved", async () => {
    const { repo, upserts } = fakeSubscriptions();
    const service = makeStripeWebhookService({
      subscriptions: repo,
      users: fakeUsers({}),
      retrieveSubscription: async () => buildSubscription(),
    });

    await service.handleEvent({
      type: "customer.subscription.deleted",
      data: { object: buildSubscription() },
    } as unknown as Stripe.Event);

    expect(upserts).toHaveLength(0);
  });

  it("retrieves the subscription on checkout.session.completed", async () => {
    const { repo, upserts } = fakeSubscriptions();
    let retrievedId = "";
    const service = makeStripeWebhookService({
      subscriptions: repo,
      users: fakeUsers({}),
      retrieveSubscription: async (id) => {
        retrievedId = id;
        return buildSubscription({ id: "sub_retrieved", metadata: { userId: "user-co" } });
      },
    });

    await service.handleEvent({
      type: "checkout.session.completed",
      data: {
        object: { subscription: "sub_x" } as unknown as Stripe.Checkout.Session,
      },
    } as unknown as Stripe.Event);

    expect(retrievedId).toBe("sub_x");
    expect(upserts).toHaveLength(1);
    expect(upserts[0]!.stripeSubscriptionId).toBe("sub_retrieved");
  });

  it("ignores unrelated event types", async () => {
    const { repo, upserts } = fakeSubscriptions();
    const service = makeStripeWebhookService({
      subscriptions: repo,
      users: fakeUsers({}),
      retrieveSubscription: async () => buildSubscription(),
    });

    await service.handleEvent({
      type: "invoice.payment_failed",
      data: { object: { id: "inv_1" } as unknown as Stripe.Invoice },
    } as unknown as Stripe.Event);

    expect(upserts).toHaveLength(0);
  });
});
