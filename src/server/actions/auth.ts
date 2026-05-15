"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

type ActionResult = { success: true } | { success: false; error: string };

export async function signInWithEmail(email: string): Promise<ActionResult> {
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
