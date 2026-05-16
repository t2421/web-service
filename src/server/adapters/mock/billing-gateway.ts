import { cookies } from "next/headers";

import "server-only";
import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  parseMockUser,
  serializeMockUser,
  type MockSubscriptionState,
} from "@/lib/mock-mode";
import type { BillingGateway } from "@/server/ports/billing-gateway";

async function setMockSubscription(state: MockSubscriptionState) {
  const store = await cookies();
  const current = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value) ?? DEFAULT_MOCK_USER;
  store.set(MOCK_SESSION_COOKIE, serializeMockUser({ ...current, subscription: state }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function makeMockBillingGateway(): BillingGateway {
  return {
    async createCheckoutUrl() {
      await setMockSubscription("active");
      return { url: "/billing?status=mock-success", customerId: "cus_mock" };
    },
    async createPortalUrl() {
      await setMockSubscription("free");
      return { url: "/billing?status=mock-portal" };
    },
  };
}
