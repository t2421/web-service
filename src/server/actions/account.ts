"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { container } from "@/server/container";
import { AppError, UnauthorizedError } from "@/server/domain/errors";
import { InvalidNameError, NAME_MAX_LENGTH } from "@/server/services/account-service";

type ActionResult = { success: true } | { success: false; error: string };

// trim 前の生入力を通す境界ガード。正規化と本検証 (trim + min/max) は service 側。
const updateProfileSchema = z.object({ name: z.string().max(NAME_MAX_LENGTH * 2) });

function toResult(error: unknown, label: string): ActionResult {
  if (error instanceof InvalidNameError) {
    return { success: false, error: "表示名は 1〜100 文字で入力してください。" };
  }
  if (error instanceof UnauthorizedError) {
    return { success: false, error: "認証が必要です。再度サインインしてください。" };
  }
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }
  logger.error(`${label} failed`, { error: String(error) });
  return { success: false, error: "サーバーエラーが発生しました。しばらく後にお試しください。" };
}

export async function updateProfile(input: { name: string }): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "表示名は 1〜100 文字で入力してください。" };
  }

  try {
    await container().accountService.updateProfile({ name: parsed.data.name });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    return toResult(error, "updateProfile");
  }
}

export async function deleteAccount(): Promise<ActionResult> {
  try {
    await container().accountService.deleteAccount();
    return { success: true };
  } catch (error) {
    return toResult(error, "deleteAccount");
  }
}
