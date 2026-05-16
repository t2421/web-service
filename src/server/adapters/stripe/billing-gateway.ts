import type Stripe from "stripe";

import "server-only";
import { ConfigError } from "@/server/domain/errors";
import type { BillingGateway } from "@/server/ports/billing-gateway";
import { absoluteUrl } from "@/lib/utils";

type StripePrices = Readonly<{ monthly?: string; yearly?: string }>;

export function makeStripeBillingGateway(stripe: Stripe, prices: StripePrices): BillingGateway {
  return {
    async createCheckoutUrl({ userId, email, plan, existingCustomerId, successPath, cancelPath }) {
      const priceId = prices[plan];
      if (!priceId) throw new ConfigError(`Stripe price for ${plan} not configured`);

      let customerId = existingCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });
        customerId = customer.id;
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: absoluteUrl(successPath),
        cancel_url: absoluteUrl(cancelPath),
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        subscription_data: { metadata: { userId } },
      });

      if (!checkout.url) throw new ConfigError("Stripe did not return a checkout URL");
      return { url: checkout.url, customerId };
    },

    async createPortalUrl({ customerId, returnPath }) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: absoluteUrl(returnPath),
      });
      return { url: portal.url };
    },
  };
}
