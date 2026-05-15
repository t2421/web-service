import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Edge-compatible: no Node-only imports (no Prisma, no Resend).
// Providers here give the middleware enough context to protect OAuth routes.
// Full provider config (including email) lives in auth.ts (Node runtime).
export const authConfig: NextAuthConfig = {
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
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PROTECTED_PATHS = ["/dashboard", "/billing", "/settings", "/account"];
      const isProtected = PROTECTED_PATHS.some((p) => nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
};
