"use server";

import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";

import { logger } from "@/lib/logger";
import { container } from "@/server/container";
import { AppError, RateLimitedError, UnauthorizedError } from "@/server/domain/errors";
import { InvalidEmailError } from "@/server/services/auth-service";

type ActionResult = { success: true } | { success: false; error: string };

async function getIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

function toResult(error: unknown): ActionResult {
  if (error instanceof InvalidEmailError) {
    return { success: false, error: "有効なメールアドレスを入力してください。" };
  }
  if (error instanceof RateLimitedError) {
    return { success: false, error: "しばらく後にお試しください。" };
  }
  if (error instanceof UnauthorizedError) {
    return { success: false, error: "認証が必要です。" };
  }
  if (error instanceof AuthError) {
    if (error.type === "EmailSignInError") {
      return {
        success: false,
        error: "メールの送信に失敗しました。アドレスを確認してください。",
      };
    }
    return { success: false, error: "認証エラーが発生しました。" };
  }
  if (error instanceof AppError) {
    return { success: false, error: error.message };
  }
  logger.error("auth action failed", { error: String(error) });
  return { success: false, error: "サーバーエラーが発生しました。しばらく後にお試しください。" };
}

export async function signInWithEmail(email: string): Promise<ActionResult> {
  try {
    await container().authService.signInWithEmail({
      email,
      ip: await getIp(),
      redirectTo: "/account",
    });
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return toResult(error);
  }
}

export async function signInWithOAuth(provider: "github" | "google"): Promise<ActionResult> {
  try {
    await container().authService.signInWithOAuth({
      provider,
      ip: await getIp(),
      redirectTo: "/account",
    });
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return toResult(error);
  }
}
