"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { mapErrorToActionResult } from "@/server/actions/_error-mapping";
import { container } from "@/server/container";
import { fail, ok, type ActionResult } from "@/server/domain/action-result";

const planSchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

type CheckoutResult = ActionResult<{ url: string }>;

export async function createCheckoutSession(input: {
  plan: "monthly" | "yearly";
}): Promise<CheckoutResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return fail("INVALID_PLAN", "Invalid plan");

  try {
    const result = await container().billingService.startCheckout({ plan: parsed.data.plan });
    revalidatePath("/billing");
    return ok({ url: result.url });
  } catch (error) {
    return mapErrorToActionResult(error);
  }
}

export async function createPortalSession(): Promise<CheckoutResult> {
  try {
    const result = await container().billingService.openBillingPortal();
    revalidatePath("/billing");
    return ok({ url: result.url });
  } catch (error) {
    return mapErrorToActionResult(error);
  }
}
