"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { container } from "@/server/container";
import { AppError, NotFoundError, UnauthorizedError } from "@/server/domain/errors";

const planSchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

type CheckoutResult = { url: string } | { error: string };

export async function createCheckoutSession(input: {
  plan: "monthly" | "yearly";
}): Promise<CheckoutResult> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { error: "不正なプランです。" };

  try {
    const result = await container().billingService.startCheckout({ plan: parsed.data.plan });
    revalidatePath("/billing");
    return { url: result.url };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: "認証が必要です。" };
    if (error instanceof AppError) return { error: error.message };
    logger.error("createCheckoutSession failed", { error: String(error) });
    return { error: "サーバーエラーが発生しました。しばらく後にお試しください。" };
  }
}

export async function createPortalSession(): Promise<CheckoutResult> {
  try {
    const result = await container().billingService.openBillingPortal();
    revalidatePath("/billing");
    return { url: result.url };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: "認証が必要です。" };
    if (error instanceof NotFoundError) return { error: "請求情報が見つかりません。" };
    if (error instanceof AppError) return { error: error.message };
    logger.error("createPortalSession failed", { error: String(error) });
    return { error: "サーバーエラーが発生しました。しばらく後にお試しください。" };
  }
}
