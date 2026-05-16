import "server-only";

import { prisma } from "@/lib/db";
import { isMockModeEnabled } from "@/lib/mock-mode";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";

import type { AuthHandlers } from "@/server/ports/auth-handlers";
import type { BillingGateway } from "@/server/ports/billing-gateway";
import type { DbHealthCheck } from "@/server/ports/db-health";
import type { RateLimiter } from "@/server/ports/rate-limiter";
import type { SessionGateway } from "@/server/ports/session-gateway";
import type { SignInGateway } from "@/server/ports/sign-in-gateway";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";
import type { UserRepository } from "@/server/ports/user-repository";

import { makeBillingService, type BillingService } from "@/server/services/billing-service";
import { makeAuthService, type AuthService } from "@/server/services/auth-service";

import { makeNextAuthInstance } from "@/server/adapters/nextauth/full-instance";
import { makeNextAuthHandlers } from "@/server/adapters/nextauth/auth-handlers";
import { makeNextAuthSessionGateway } from "@/server/adapters/nextauth/session-gateway";
import { makeNextAuthSignInGateway } from "@/server/adapters/nextauth/sign-in-gateway";

import { makePrismaAuthDbAdapter } from "@/server/adapters/prisma/auth-db-adapter";
import { makePrismaDbHealthCheck } from "@/server/adapters/prisma/db-health";
import { makePrismaSubscriptionRepository } from "@/server/adapters/prisma/subscription-repository";
import { makePrismaUserRepository } from "@/server/adapters/prisma/user-repository";

import { makeStripeBillingGateway } from "@/server/adapters/stripe/billing-gateway";
import { makeUpstashRateLimiter } from "@/server/adapters/upstash/rate-limiter";

import { makeMockAuthHandlers } from "@/server/adapters/mock/auth-handlers";
import { makeMockBillingGateway } from "@/server/adapters/mock/billing-gateway";
import { makeMockDbHealthCheck } from "@/server/adapters/mock/db-health";
import { makeNoopRateLimiter } from "@/server/adapters/mock/rate-limiter";
import { makeMockSessionGateway } from "@/server/adapters/mock/session-gateway";
import { makeMockSignInGateway } from "@/server/adapters/mock/sign-in-gateway";
import { makeMockSubscriptionRepository } from "@/server/adapters/mock/subscription-repository";
import { makeMockUserRepository } from "@/server/adapters/mock/user-repository";

export type Container = Readonly<{
  // Auth
  sessions: SessionGateway;
  signIn: SignInGateway;
  authHandlers: AuthHandlers;
  // DB
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  dbHealth: DbHealthCheck;
  // External services
  billingGateway: BillingGateway;
  emailLimiter: RateLimiter;
  oauthLimiter: RateLimiter;
  // Use cases
  billingService: BillingService;
  authService: AuthService;
}>;

// The composition root. The ONLY place where:
//   - E2E_MOCK_MODE branches between real and mock implementations
//   - The concrete auth provider (NextAuth) is wired to its DB adapter
//   - The concrete ORM (Prisma) is selected
// Swapping NextAuth -> Clerk: replace the `auth-*` block. Swapping Prisma -> Drizzle:
// replace the `db-*` block. Mock branch stays untouched.
function build(): Container {
  const mock = isMockModeEnabled();

  // --- DB layer ---
  const users: UserRepository = mock ? makeMockUserRepository() : makePrismaUserRepository(prisma);
  const subscriptions: SubscriptionRepository = mock
    ? makeMockSubscriptionRepository()
    : makePrismaSubscriptionRepository(prisma);
  const dbHealth: DbHealthCheck = mock ? makeMockDbHealthCheck() : makePrismaDbHealthCheck(prisma);

  // --- Auth layer ---
  // The NextAuth instance is built here with the chosen DB adapter, so swapping
  // ORMs is a single import change (PrismaAdapter -> DrizzleAdapter).
  const nextAuthInstance = mock ? null : makeNextAuthInstance(makePrismaAuthDbAdapter(prisma));

  const sessions: SessionGateway = mock
    ? makeMockSessionGateway()
    : makeNextAuthSessionGateway(() => nextAuthInstance!.auth());

  const signIn: SignInGateway = mock
    ? makeMockSignInGateway()
    : makeNextAuthSignInGateway(
        nextAuthInstance!.signIn as unknown as Parameters<typeof makeNextAuthSignInGateway>[0],
      );

  const authHandlers: AuthHandlers = mock
    ? makeMockAuthHandlers()
    : makeNextAuthHandlers(nextAuthInstance!);

  // --- External services ---
  // Stripe gateway can be constructed even when STRIPE_SECRET_KEY is unset; it
  // throws ConfigError at call-time so `next build` page-data collection (which
  // imports the routes without ever invoking checkout) doesn't crash.
  const billingGateway: BillingGateway = mock
    ? makeMockBillingGateway()
    : makeStripeBillingGateway(stripe, STRIPE_PRICES);

  const emailLimiter: RateLimiter = mock
    ? makeNoopRateLimiter()
    : makeUpstashRateLimiter({ requests: 5, window: "15 m", prefix: "auth:email" });
  const oauthLimiter: RateLimiter = mock
    ? makeNoopRateLimiter()
    : makeUpstashRateLimiter({ requests: 10, window: "15 m", prefix: "auth:oauth" });

  return {
    sessions,
    signIn,
    authHandlers,
    users,
    subscriptions,
    dbHealth,
    billingGateway,
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
