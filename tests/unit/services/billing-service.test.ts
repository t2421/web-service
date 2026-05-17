import { describe, expect, it } from "vitest";

import type { AuthSession } from "@/server/domain/auth";
import type { Subscription } from "@/server/domain/billing";
import { UnauthorizedError, NotFoundError } from "@/server/domain/errors";
import type { BillingGateway, CheckoutInput } from "@/server/ports/billing-gateway";
import type { SessionGateway } from "@/server/ports/session-gateway";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";
import type { UserRecord, UserRepository } from "@/server/ports/user-repository";
import { makeBillingService } from "@/server/services/billing-service";

function fakeSessions(session: AuthSession | null): SessionGateway {
  return { getSession: async () => session };
}

function fakeSubscriptions(map: Record<string, Subscription>): SubscriptionRepository {
  return { findByUserId: async (id) => map[id] ?? null };
}

function fakeUsers(initial: Record<string, UserRecord>) {
  const data = { ...initial };
  const writes: Array<{ id: string; customerId: string }> = [];
  const repo: UserRepository = {
    findById: async (id) => data[id] ?? null,
    setStripeCustomerId: async (id, customerId) => {
      writes.push({ id, customerId });
      const existing = data[id];
      if (existing) data[id] = { ...existing, stripeCustomerId: customerId };
    },
  };
  return { repo, writes };
}

function fakeBilling(stub: { url: string; customerId: string }): {
  gateway: BillingGateway;
  calls: CheckoutInput[];
} {
  const calls: CheckoutInput[] = [];
  const gateway: BillingGateway = {
    createCheckoutUrl: async (input) => {
      calls.push(input);
      return stub;
    },
    createPortalUrl: async ({ returnPath }) => ({ url: `https://portal.example${returnPath}` }),
  };
  return { gateway, calls };
}

const SESSION: AuthSession = {
  user: {
    id: "user-1",
    name: "Alice",
    email: "alice@example.com",
    image: null,
    role: "USER",
  },
  expiresAt: new Date(),
};

describe("BillingService.getCurrentSubscription", () => {
  it("returns null when there is no session", async () => {
    const svc = makeBillingService({
      sessions: fakeSessions(null),
      users: fakeUsers({}).repo,
      subscriptions: fakeSubscriptions({}),
      billing: fakeBilling({ url: "", customerId: "" }).gateway,
    });
    expect(await svc.getCurrentSubscription()).toBeNull();
  });

  it("returns the subscription for the session user", async () => {
    const sub: Subscription = {
      status: "active",
      priceId: "price_1",
      currentPeriodEnd: new Date("2030-01-01"),
    };
    const svc = makeBillingService({
      sessions: fakeSessions(SESSION),
      users: fakeUsers({}).repo,
      subscriptions: fakeSubscriptions({ "user-1": sub }),
      billing: fakeBilling({ url: "", customerId: "" }).gateway,
    });
    expect(await svc.getCurrentSubscription()).toEqual(sub);
  });
});

describe("BillingService.startCheckout", () => {
  it("throws UnauthorizedError without a session", async () => {
    const svc = makeBillingService({
      sessions: fakeSessions(null),
      users: fakeUsers({}).repo,
      subscriptions: fakeSubscriptions({}),
      billing: fakeBilling({ url: "x", customerId: "c" }).gateway,
    });
    await expect(svc.startCheckout({ plan: "monthly" })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("persists a new customer id when the gateway returns one", async () => {
    const users = fakeUsers({
      "user-1": { id: "user-1", email: "alice@example.com", stripeCustomerId: null },
    });
    const billing = fakeBilling({ url: "https://checkout.example", customerId: "cus_new" });
    const svc = makeBillingService({
      sessions: fakeSessions(SESSION),
      users: users.repo,
      subscriptions: fakeSubscriptions({}),
      billing: billing.gateway,
    });

    const result = await svc.startCheckout({ plan: "monthly" });

    expect(result.url).toBe("https://checkout.example");
    expect(users.writes).toEqual([{ id: "user-1", customerId: "cus_new" }]);
    expect(billing.calls[0]).toMatchObject({
      userId: "user-1",
      plan: "monthly",
      existingCustomerId: null,
    });
  });

  it("does not persist when the customer id is unchanged", async () => {
    const users = fakeUsers({
      "user-1": { id: "user-1", email: "alice@example.com", stripeCustomerId: "cus_existing" },
    });
    const svc = makeBillingService({
      sessions: fakeSessions(SESSION),
      users: users.repo,
      subscriptions: fakeSubscriptions({}),
      billing: fakeBilling({ url: "u", customerId: "cus_existing" }).gateway,
    });
    await svc.startCheckout({ plan: "yearly" });
    expect(users.writes).toEqual([]);
  });
});

describe("BillingService.openBillingPortal", () => {
  it("throws NotFoundError when the user has no stripe customer", async () => {
    const svc = makeBillingService({
      sessions: fakeSessions(SESSION),
      users: fakeUsers({
        "user-1": { id: "user-1", email: "alice@example.com", stripeCustomerId: null },
      }).repo,
      subscriptions: fakeSubscriptions({}),
      billing: fakeBilling({ url: "", customerId: "" }).gateway,
    });
    await expect(svc.openBillingPortal()).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns the portal URL for the user's customer id", async () => {
    const svc = makeBillingService({
      sessions: fakeSessions(SESSION),
      users: fakeUsers({
        "user-1": {
          id: "user-1",
          email: "alice@example.com",
          stripeCustomerId: "cus_alice",
        },
      }).repo,
      subscriptions: fakeSubscriptions({}),
      billing: fakeBilling({ url: "", customerId: "" }).gateway,
    });
    const result = await svc.openBillingPortal();
    expect(result.url).toBe("https://portal.example/billing");
  });
});
