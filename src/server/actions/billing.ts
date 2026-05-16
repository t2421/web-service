"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { container } from "@/server/container";
import { AppError, NotFoundError, UnauthorizedError } from "@/server/domain/errors";

const planSchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

type CheckoutResult = { url: string } | { error: string };

export async function createCheckoutSession(input: {
  plan: "monthly" | "yearly";
}): Promise<CheckoutResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid plan" };

  try {
    const result = await container().billingService.startCheckout({ plan: parsed.data.plan });
    revalidatePath("/billing");
    return { url: result.url };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: "Unauthorized" };
    if (error instanceof AppError) return { error: error.message };
    console.error("[createCheckoutSession]", error);
    return { error: "Server error" };
  }
}

export async function createPortalSession(): Promise<CheckoutResult> {
  try {
    const result = await container().billingService.openBillingPortal();
    revalidatePath("/billing");
    return { url: result.url };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: "Unauthorized" };
    if (error instanceof NotFoundError) return { error: "No customer" };
    if (error instanceof AppError) return { error: error.message };
    console.error("[createPortalSession]", error);
    return { error: "Server error" };
  }
}
