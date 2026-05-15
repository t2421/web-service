import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

// Edge-compatible: uses authConfig which has no Node-only imports (no DB, no email)
export const { auth: middleware } = NextAuth(authConfig);
export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
