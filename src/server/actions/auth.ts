"use server";

import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { createRateLimiter } from "@/lib/redis";

const emailRateLimiter = createRateLimiter({ requests: 5, window: "15 m", prefix: "auth:email" });
const oauthRateLimiter = createRateLimiter({ requests: 10, window: "15 m", prefix: "auth:oauth" });
const emailSchema = z.string().email().max(254);

type ActionResult = { success: true } | { success: false; error: string };

async function getIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function signInWithEmail(rawEmail: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    return { success: false, error: "有効なメールアドレスを入力してください。" };
  }
  const email = parsed.data;

  const { success: rateOk } = await emailRateLimiter.limit(await getIp());
  if (!rateOk) {
    return { success: false, error: "しばらく後にお試しください。" };
  }

  try {
    await signIn("resend", { email, redirectTo: "/account" });
    return { success: true };
  } catch (error) {
    // signIn throws NEXT_REDIRECT on success — re-throw so Next.js navigates to /sign-in/verify.
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      switch (error.type) {
        case "EmailSignInError":
          return {
            success: false,
            error: "メールの送信に失敗しました。アドレスを確認してください。",
          };
        default:
          return { success: false, error: "認証エラーが発生しました。" };
      }
    }
    console.error("[signInWithEmail]", error);
    return { success: false, error: "サーバーエラーが発生しました。しばらく後にお試しください。" };
  }
}

export async function signInWithOAuth(provider: "github" | "google"): Promise<ActionResult> {
  const { success: rateOk } = await oauthRateLimiter.limit(await getIp());
  if (!rateOk) {
    return { success: false, error: "しばらく後にお試しください。" };
  }

  try {
    await signIn(provider, { redirectTo: "/account" });
    return { success: true };
  } catch (error) {
    // OAuth signIn redirects to the provider on success; only real errors reach here.
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { success: false, error: "OAuth 認証に失敗しました。" };
    }
    console.error("[signInWithOAuth]", error);
    return { success: false, error: "サーバーエラーが発生しました。しばらく後にお試しください。" };
  }
}
