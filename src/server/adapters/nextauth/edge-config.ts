import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { PROTECTED_PATHS } from "@/server/domain/constants";

// Edge-compatible NextAuth config: no Node-only imports (no Prisma, no Resend).
// Used both by middleware and as the base of the full Node-side instance.
export const nextAuthEdgeConfig: NextAuthConfig = {
  // In development we trust the request's Host header so callbacks work on
  // whatever localhost / LAN address you're hitting without needing
  // AUTH_TRUST_HOST or AUTH_URL. In production, leave this unset and rely on
  // AUTH_URL / AUTH_TRUST_HOST explicitly to avoid Host-header spoofing.
  trustHost: process.env.NODE_ENV === "development" ? true : undefined,
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/verify",
    error: "/sign-in",
  },
  providers: [
    ...(process.env.AUTH_GITHUB_ID
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
          }),
        ]
      : []),
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async authorized({ auth, request }) {
      const isProtected = PROTECTED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
      if (!isProtected) return true;
      return !!auth?.user;
    },
  },
};
