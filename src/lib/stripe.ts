import Stripe from "stripe";

import "server-only";
import { env } from "@/lib/env";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
      appInfo: {
        name: "web-service",
        version: "0.1.0",
      },
    })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.");
  }
  return stripe;
}

export const STRIPE_PRICES = {
  monthly: env.STRIPE_PRICE_ID_PRO_MONTHLY,
  yearly: env.STRIPE_PRICE_ID_PRO_YEARLY,
} as const;
