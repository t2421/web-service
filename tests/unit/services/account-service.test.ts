import { describe, expect, it } from "vitest";

import type { AuthSession } from "@/server/domain/auth";
import type { Subscription } from "@/server/domain/billing";
import { UnauthorizedError } from "@/server/domain/errors";
import type { AuditEntry, AuditLogger } from "@/server/ports/audit-logger";
import type { BillingGateway } from "@/server/ports/billing-gateway";
import type { SessionGateway } from "@/server/ports/session-gateway";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";
import type { UserRecord, UserRepository } from "@/server/ports/user-repository";
import { InvalidNameError, makeAccountService } from "@/server/services/account-service";

const SESSION: AuthSession = {
  user: {
    id: "user-1",
    name: "Session Name",
    email: "alice@example.com",
    image: null,
    role: "USER",
  },
  expiresAt: new Date(),
};

function fakeSessions(session: AuthSession | null) {
  let destroyed = 0;
  const gateway: SessionGateway = {
    getSession: async () => session,
    destroySession: async () => {
      destroyed += 1;
    },
  };
  return { gateway, destroyedCount: () => destroyed };
}

function fakeUsers(initial: Record<string, UserRecord>) {
  const data = { ...initial };
  const nameWrites: Array<{ id: string; name: string }> = [];
  const deletes: string[] = [];
  const repo: UserRepository = {
    findById: async (id) => data[id] ?? null,
    updateName: async (id, name) => {
      nameWrites.push({ id, name });
      const existing = data[id];
      if (existing) data[id] = { ...existing, name };
    },
    setStripeCustomerId: async () => {},
    deleteById: async (id) => {
      deletes.push(id);
      delete data[id];
    },
  };
  return { repo, nameWrites, deletes };
}

function fakeSubscriptions(map: Record<string, Subscription>): SubscriptionRepository {
  return { findByUserId: async (id) => map[id] ?? null };
}

function fakeBilling(opts: { failCancel?: boolean } = {}) {
  const cancels: string[] = [];
  const gateway: BillingGateway = {
    createCheckoutUrl: async () => ({ url: "", customerId: "" }),
    createPortalUrl: async () => ({ url: "" }),
    cancelSubscription: async (id) => {
      if (opts.failCancel) throw new Error("stripe down");
      cancels.push(id);
    },
  };
  return { gateway, cancels };
}

function fakeAudit() {
  const entries: AuditEntry[] = [];
  const audit: AuditLogger = {
    record: async (entry) => {
      entries.push(entry);
    },
  };
  return { audit, entries };
}

const ALICE: UserRecord = {
  id: "user-1",
  name: "DB Name",
  email: "db@example.com",
  stripeCustomerId: null,
};

function makeService(opts: {
  session?: AuthSession | null;
  users?: ReturnType<typeof fakeUsers>;
  subscriptions?: Record<string, Subscription>;
  billing?: ReturnType<typeof fakeBilling>;
}) {
  const users = opts.users ?? fakeUsers({ "user-1": ALICE });
  const billing = opts.billing ?? fakeBilling();
  const auditFake = fakeAudit();
  const sessions = fakeSessions(opts.session === undefined ? SESSION : opts.session);
  const service = makeAccountService({
    sessions: sessions.gateway,
    users: users.repo,
    subscriptions: fakeSubscriptions(opts.subscriptions ?? {}),
    billing: billing.gateway,
    audit: auditFake.audit,
  });
  return { service, users, billing, audit: auditFake, sessions };
}

describe("AccountService.getProfile", () => {
  it("returns null without a session", async () => {
    const { service } = makeService({ session: null });
    expect(await service.getProfile()).toBeNull();
  });

  it("prefers DB values over the (possibly stale) JWT session", async () => {
    const { service } = makeService({});
    expect(await service.getProfile()).toEqual({
      id: "user-1",
      name: "DB Name",
      email: "db@example.com",
      image: null,
    });
  });

  it("falls back to session values when the user row is missing", async () => {
    const { service } = makeService({ users: fakeUsers({}) });
    expect(await service.getProfile()).toEqual({
      id: "user-1",
      name: "Session Name",
      email: "alice@example.com",
      image: null,
    });
  });
});

describe("AccountService.updateProfile", () => {
  it("throws UnauthorizedError without a session", async () => {
    const { service } = makeService({ session: null });
    await expect(service.updateProfile({ name: "New" })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects an empty or too-long name", async () => {
    const { service, users } = makeService({});
    await expect(service.updateProfile({ name: "   " })).rejects.toBeInstanceOf(InvalidNameError);
    await expect(service.updateProfile({ name: "a".repeat(101) })).rejects.toBeInstanceOf(
      InvalidNameError,
    );
    expect(users.nameWrites).toEqual([]);
  });

  it("trims, persists and records an audit entry", async () => {
    const { service, users, audit } = makeService({});
    await service.updateProfile({ name: "  New Name  " });
    expect(users.nameWrites).toEqual([{ id: "user-1", name: "New Name" }]);
    expect(audit.entries).toEqual([
      { userId: "user-1", action: "account.profile_updated", metadata: { name: "New Name" } },
    ]);
  });
});

describe("AccountService.deleteAccount", () => {
  const ACTIVE_SUB: Subscription = {
    stripeSubscriptionId: "sub_1",
    status: "active",
    priceId: "price_1",
    currentPeriodEnd: new Date("2030-01-01"),
  };

  it("throws UnauthorizedError without a session", async () => {
    const { service } = makeService({ session: null });
    await expect(service.deleteAccount()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("cancels an active subscription before deleting the user", async () => {
    const { service, users, billing, audit, sessions } = makeService({
      subscriptions: { "user-1": ACTIVE_SUB },
    });
    await service.deleteAccount();
    expect(billing.cancels).toEqual(["sub_1"]);
    expect(users.deletes).toEqual(["user-1"]);
    expect(sessions.destroyedCount()).toBe(1);
    expect(audit.entries).toEqual([
      { userId: "user-1", action: "account.deleted", metadata: { email: "alice@example.com" } },
    ]);
  });

  it("skips cancellation when there is no active subscription", async () => {
    const { service, users, billing } = makeService({
      subscriptions: { "user-1": { ...ACTIVE_SUB, status: "canceled" } },
    });
    await service.deleteAccount();
    expect(billing.cancels).toEqual([]);
    expect(users.deletes).toEqual(["user-1"]);
  });

  it("does not delete the user when subscription cancellation fails", async () => {
    const { service, users, sessions } = makeService({
      subscriptions: { "user-1": ACTIVE_SUB },
      billing: fakeBilling({ failCancel: true }),
    });
    await expect(service.deleteAccount()).rejects.toThrow("stripe down");
    expect(users.deletes).toEqual([]);
    expect(sessions.destroyedCount()).toBe(0);
  });
});
