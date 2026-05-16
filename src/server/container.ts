import "server-only";

import { auth as nextAuthSession, signIn as nextAuthSignIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isMockModeEnabled } from "@/lib/mock-mode";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

import { ConfigError } from "@/server/domain/errors";
import type { BillingGateway } from "@/server/ports/billing-gateway";
import type { RateLimiter } from "@/server/ports/rate-limiter";
import type { SessionGateway } from "@/server/ports/session-gateway";
import type { SignInGateway } from "@/server/ports/sign-in-gateway";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";
import type { UserRepository } from "@/server/ports/user-repository";

import { makeBillingService, type BillingService } from "@/server/services/billing-service";
import { makeAuthService, type AuthService } from "@/server/services/auth-service";

import { makePrismaSubscriptionRepository } from "@/server/adapters/prisma/subscription-repository";
import { makePrismaUserRepository } from "@/server/adapters/prisma/user-repository";
import { makeStripeBillingGateway } from "@/server/adapters/stripe/billing-gateway";
import { makeNextAuthSessionGateway } from "@/server/adapters/nextauth/session-gateway";
import { makeNextAuthSignInGateway } from "@/server/adapters/nextauth/sign-in-gateway";
import { makeUpstashRateLimiter } from "@/server/adapters/upstash/rate-limiter";

import { makeMockSessionGateway } from "@/server/adapters/mock/session-gateway";
import { makeMockSignInGateway } from "@/server/adapters/mock/sign-in-gateway";
import { makeMockSubscriptionRepository } from "@/server/adapters/mock/subscription-repository";
import { makeMockUserRepository } from "@/server/adapters/mock/user-repository";
import { makeMockBillingGateway } from "@/server/adapters/mock/billing-gateway";
import { makeNoopRateLimiter } from "@/server/adapters/mock/rate-limiter";

export type Container = Readonly<{
  sessions: SessionGateway;
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  billingGateway: BillingGateway;
  signIn: SignInGateway;
  emailLimiter: RateLimiter;
  oauthLimiter: RateLimiter;
  billingService: BillingService;
  authService: AuthService;
}>;

// The composition root. The ONLY place where E2E_MOCK_MODE branches.
// Adapters above this layer never inspect environment variables for runtime mode.
function build(): Container {
  const mock = isMockModeEnabled();

  const sessions: SessionGateway = mock
    ? makeMockSessionGateway()
    : makeNextAuthSessionGateway(() => nextAuthSession());

  const signIn: SignInGateway = mock
    ? makeMockSignInGateway()
    : makeNextAuthSignInGateway(
        nextAuthSignIn as unknown as Parameters<typeof makeNextAuthSignInGateway>[0],
      );

  const users: UserRepository = mock ? makeMockUserRepository() : makePrismaUserRepository(prisma);

  const subscriptions: SubscriptionRepository = mock
    ? makeMockSubscriptionRepository()
    : makePrismaSubscriptionRepository(prisma);

  const billingGateway: BillingGateway = mock
    ? makeMockBillingGateway()
    : (() => {
        if (!stripe) throw new ConfigError("Stripe is not configured. Set STRIPE_SECRET_KEY.");
        return makeStripeBillingGateway(stripe, STRIPE_PRICES);
      })();

  const emailLimiter: RateLimiter = mock
    ? makeNoopRateLimiter()
    : makeUpstashRateLimiter({ requests: 5, window: "15 m", prefix: "auth:email" });

  const oauthLimiter: RateLimiter = mock
    ? makeNoopRateLimiter()
    : makeUpstashRateLimiter({ requests: 10, window: "15 m", prefix: "auth:oauth" });

  return {
    sessions,
    users,
    subscriptions,
    billingGateway,
    signIn,
    emailLimiter,
    oauthLimiter,
    billingService: makeBillingService({ sessions, users, subscriptions, billing: billingGateway }),
    authService: makeAuthService({ signIn, emailLimiter, oauthLimiter }),
  };
}

let instance: Container | null = null;

export function container(): Container {
  if (!instance) instance = build();
  return instance;
}

// Test helper: replace any subset of dependencies. Unit tests use this to
// inject fakes without touching production adapters. Do not call in app code.
export function __setContainerForTests(overrides: Partial<Container>): () => void {
  const previous = instance;
  instance = { ...(instance ?? build()), ...overrides };
  return () => {
    instance = previous;
  };
}

export function __resetContainerForTests(): void {
  instance = null;
}
