import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
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
    logger.error("stripe webhook signature verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 冪等性: Stripe は同一イベントを再送しうる。先にイベント ID を「クレーム」し、
  // 同時再送の片方だけが処理を進める (check-then-act の競合を防ぐ)。
  const claimed = await claimEvent(event);
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
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
        logger.warn("stripe payment failed", { invoiceId: invoice.id });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // クレームを解放して 500 を返す → Stripe が再送してリトライされる。
    logger.error("stripe webhook handler error", { eventId: event.id, error: String(err) });
    await releaseEvent(event.id);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  // 再送ウィンドウ (数日) を大きく超えた古い行を掃除し、テーブルの無限成長を防ぐ。
  await cleanupOldEvents();

  return NextResponse.json({ received: true });
}

async function claimEvent(event: Stripe.Event): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({ data: { id: event.id, type: event.type } });
    return true;
  } catch (err) {
    // P2002 (unique violation) = 既にクレーム済み or 処理済み。
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
    throw err;
  }
}

async function releaseEvent(eventId: string) {
  try {
    await prisma.webhookEvent.delete({ where: { id: eventId } });
  } catch (err) {
    // 解放失敗はログに留める。イベントは処理済み扱いのまま残るが、
    // Stripe ダッシュボードから手動再送すれば復旧できる。
    logger.error("failed to release webhook event claim", {
      eventId,
      error: String(err),
    });
  }
}

const EVENT_RETENTION_DAYS = 30;

async function cleanupOldEvents() {
  try {
    const cutoff = new Date(Date.now() - EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.webhookEvent.deleteMany({ where: { processedAt: { lt: cutoff } } });
  } catch (err) {
    logger.warn("webhook event cleanup failed", { error: String(err) });
  }
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  const userId =
    (subscription.metadata?.userId as string | undefined) ??
    (await resolveUserIdFromCustomer(subscription.customer));
  if (!userId) {
    logger.warn("stripe subscription without resolvable user", {
      subscriptionId: subscription.id,
    });
    return;
  }

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

  await prisma.auditLog.create({
    data: {
      userId,
      action: "billing.subscription_synced",
      metadata: { subscriptionId: subscription.id, status: subscription.status },
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
