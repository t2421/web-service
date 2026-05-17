import "server-only";
import { writeMockUser } from "@/server/adapters/mock/cookie-helpers";
import type { BillingGateway } from "@/server/ports/billing-gateway";

export function makeMockBillingGateway(): BillingGateway {
  return {
    async createCheckoutUrl() {
      await writeMockUser({ subscription: "active" });
      return { url: "/billing?status=mock-success", customerId: "cus_mock" };
    },
    async createPortalUrl() {
      await writeMockUser({ subscription: "free" });
      return { url: "/billing?status=mock-portal" };
    },
  };
}
