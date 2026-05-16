import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// Edge-compatible NextAuth config: no Node-only imports (no Prisma, no Resend).
// Used both by middleware and as the base of the full Node-side instance.
export const nextAuthEdgeConfig: NextAuthConfig = {
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
      const PROTECTED_PATHS = ["/dashboard", "/billing", "/settings", "/account"];
      const isProtected = PROTECTED_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
      if (!isProtected) return true;
      return !!auth?.user;
    },
  },
};
