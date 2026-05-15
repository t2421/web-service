import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { requireStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = requireStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("Stripe webhook verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("Payment failed", { invoiceId: invoice.id });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const userId =
    (subscription.metadata?.userId as string | undefined) ??
    (await resolveUserIdFromCustomer(subscription.customer));
  if (!userId) return;

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id ?? null;
  // Stripe 22+: current_period_end moved from Subscription to SubscriptionItem
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : null;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function resolveUserIdFromCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): Promise<string | null> {
  const customerId = typeof customer === "string" ? customer : customer.id;
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}
