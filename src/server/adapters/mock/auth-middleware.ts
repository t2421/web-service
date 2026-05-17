import { NextResponse } from "next/server";

import { MOCK_SESSION_COOKIE, parseMockUser } from "@/lib/mock-mode";
import { PROTECTED_PATHS } from "@/server/domain/constants";
import type { AuthMiddleware } from "@/server/ports/auth-middleware";

// Edge-safe middleware: authorize based purely on the mock cookie. No NextAuth,
// no DB, no env reads beyond what mock-mode.ts already did upstream.
export const mockAuthMiddleware: AuthMiddleware = (request) => {
  const path = request.nextUrl.pathname;
  if (!PROTECTED_PATHS.some((p) => path.startsWith(p))) return NextResponse.next();

  const cookie = request.cookies.get(MOCK_SESSION_COOKIE)?.value;
  if (parseMockUser(cookie)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("callbackUrl", request.url);
  return NextResponse.redirect(url);
};
