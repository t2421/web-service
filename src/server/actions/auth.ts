"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";

import { mapErrorToActionResult } from "@/server/actions/_error-mapping";
import { getClientIp } from "@/server/actions/_request-context";
import { container } from "@/server/container";
import { ok, type ActionResult } from "@/server/domain/action-result";

export async function signInWithEmail(email: string): Promise<ActionResult> {
  try {
    await container().authService.signInWithEmail({
      email,
      ip: await getClientIp(),
      redirectTo: "/account",
    });
    return ok();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return mapErrorToActionResult(error);
  }
}

export async function signInWithOAuth(provider: "github" | "google"): Promise<ActionResult> {
  try {
    await container().authService.signInWithOAuth({
      provider,
      ip: await getClientIp(),
      redirectTo: "/account",
    });
    return ok();
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return mapErrorToActionResult(error);
  }
}
