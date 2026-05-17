import { AuthError } from "next-auth";

import { fail, type ActionResult } from "@/server/domain/action-result";
import {
  AppError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
} from "@/server/domain/errors";
import { InvalidEmailError } from "@/server/services/auth-service";

export function mapErrorToActionResult(error: unknown): ActionResult<never> {
  if (error instanceof InvalidEmailError) {
    return fail("INVALID_EMAIL", "有効なメールアドレスを入力してください。");
  }
  if (error instanceof RateLimitedError) {
    return fail("RATE_LIMITED", "しばらく後にお試しください。");
  }
  if (error instanceof UnauthorizedError) {
    return fail("UNAUTHORIZED", "認証が必要です。");
  }
  if (error instanceof NotFoundError) {
    return fail("NOT_FOUND", "対象が見つかりませんでした。");
  }
  if (error instanceof AuthError) {
    if (error.type === "EmailSignInError") {
      return fail("EMAIL_SEND_FAILED", "メールの送信に失敗しました。アドレスを確認してください。");
    }
    return fail("AUTH_ERROR", "認証エラーが発生しました。");
  }
  if (error instanceof AppError) {
    return fail(error.code, error.message);
  }
  console.error("[action-error]", error);
  return fail("SERVER_ERROR", "サーバーエラーが発生しました。しばらく後にお試しください。");
}
