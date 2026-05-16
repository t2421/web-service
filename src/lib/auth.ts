import { cookies } from "next/headers";
import NextAuth, { type Session } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import WebAuthn from "next-auth/providers/webauthn";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMagicLinkEmail } from "@/lib/email";
import { authConfig } from "@/lib/auth.config";
import {
  MOCK_SESSION_COOKIE,
  isMockModeEnabled,
  mockSessionFromUser,
  parseMockUser,
} from "@/lib/mock-mode";

const nextAuth = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT strategy: Edge middleware verifies sessions from the signed cookie without DB access.
  // Database sessions use opaque tokens that cannot be verified at the Edge.
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  providers: [
    ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: env.AUTH_GITHUB_ID,
            clientSecret: env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: env.RESEND_API_KEY,
            from: env.EMAIL_FROM ?? "noreply@example.com",
            async sendVerificationRequest({ identifier, url }) {
              try {
                await sendMagicLinkEmail({ to: identifier, url });
              } catch (err) {
                console.error("[auth] sendVerificationRequest failed:", err);
                throw err;
              }
            },
          }),
        ]
      : []),
    WebAuthn,
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
  // AUTH_URL env var pins the trusted host; trustHost: true is intentionally omitted.
});

export const { handlers, signIn, signOut } = nextAuth;
const nextAuthSession = nextAuth.auth;

// Server-side session accessor. In mock mode the __e2e_mock_user cookie short-circuits
// NextAuth so Playwright tests don't need OAuth / email / DB-backed sign-in.
export async function auth(): Promise<Session | null> {
  if (isMockModeEnabled()) {
    const store = await cookies();
    const mockUser = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value);
    if (mockUser) return mockSessionFromUser(mockUser);
  }
  return nextAuthSession();
}
