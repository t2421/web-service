import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import WebAuthn from "next-auth/providers/webauthn";

import "server-only";
import { env } from "@/lib/env";
import { sendMagicLinkEmail } from "@/lib/email";
import { nextAuthEdgeConfig } from "@/server/adapters/nextauth/edge-config";

// Full NextAuth instance. The DB adapter is injected so swapping ORMs (Prisma → Drizzle / Mongo)
// is a single container.ts change. To replace NextAuth entirely (e.g. with Clerk / Lucia),
// don't touch this file — replace the adapter wiring in `container.ts` and `edge-container.ts`.
export type NextAuthInstance = ReturnType<typeof makeNextAuthInstance>;

export function makeNextAuthInstance(adapter: Adapter) {
  return NextAuth({
    ...nextAuthEdgeConfig,
    adapter,
    // JWT strategy: Edge middleware verifies sessions from the signed cookie without DB access.
    session: { strategy: "jwt" },
    experimental: { enableWebAuthn: true },
    providers: [
      ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
        ? [GitHub({ clientId: env.AUTH_GITHUB_ID, clientSecret: env.AUTH_GITHUB_SECRET })]
        : []),
      ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
        ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
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
      ...nextAuthEdgeConfig.callbacks,
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
  });
}
