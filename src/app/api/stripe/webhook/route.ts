import type Stripe from "stripe";

import { requireStripe } from "@/lib/stripe";
import { container } from "@/server/container";
import { apiError, apiOk } from "@/server/domain/api-response";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return apiError("NOT_CONFIGURED", "Webhook not configured", 500);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return apiError("MISSING_SIGNATURE", "Missing signature", 400);

  const stripe = requireStripe();
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook verification failed", err);
    return apiError("INVALID_SIGNATURE", "Invalid signature", 400);
  }

  try {
    await container().stripeWebhookService.handleEvent(event);
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return apiError("HANDLER_ERROR", "Handler error", 500);
  }

  return apiOk({ received: true });
}
