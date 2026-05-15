import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import WebAuthn from "next-auth/providers/webauthn";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendMagicLinkEmail } from "@/lib/email";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
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
  trustHost: true,
});
