"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STRIPE_PRICES, requireStripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  isMockModeEnabled,
  parseMockUser,
  serializeMockUser,
} from "@/lib/mock-mode";

const planSchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

async function setMockSubscription(state: "free" | "active") {
  const store = await cookies();
  const current = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value) ?? DEFAULT_MOCK_USER;
  store.set(MOCK_SESSION_COOKIE, serializeMockUser({ ...current, subscription: state }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function createCheckoutSession(input: { plan: "monthly" | "yearly" }) {
  const { plan } = planSchema.parse(input);
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "Unauthorized" } as const;
  }

  if (isMockModeEnabled()) {
    await setMockSubscription("active");
    revalidatePath("/billing");
    return { url: "/billing?status=mock-success" } as const;
  }

  const priceId = STRIPE_PRICES[plan];
  if (!priceId) {
    return { error: "Plan not configured" } as const;
  }

  const stripe = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  let customerId = user?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: absoluteUrl("/billing?status=success"),
    cancel_url: absoluteUrl("/billing?status=canceled"),
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    subscription_data: { metadata: { userId: session.user.id } },
  });

  revalidatePath("/billing");
  return { url: checkout.url } as const;
}

export async function createPortalSession() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" } as const;

  if (isMockModeEnabled()) {
    await setMockSubscription("free");
    revalidatePath("/billing");
    return { url: "/billing?status=mock-portal" } as const;
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) return { error: "No customer" } as const;

  const stripe = requireStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: absoluteUrl("/billing"),
  });

  return { url: portal.url } as const;
}
