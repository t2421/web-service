"use client";

import { signOut as nextAuthSignOut } from "next-auth/react";
import { signIn as nextAuthWebAuthn } from "next-auth/webauthn";

// The single entry point client components use for browser-side auth. Swapping
// the auth provider (NextAuth -> Clerk / Lucia / custom) means replacing the
// implementations in this file — no component changes.
export type SignOutOptions = { callbackUrl?: string };

export const authClient = {
  async signOut(opts?: SignOutOptions) {
    await nextAuthSignOut({ callbackUrl: opts?.callbackUrl ?? "/" });
  },

  async registerPasskey(opts?: { callbackUrl?: string }) {
    await nextAuthWebAuthn("webauthn", {
      action: "register",
      callbackUrl: opts?.callbackUrl ?? "/account",
    });
  },

  async authenticateWithPasskey(opts?: { callbackUrl?: string }) {
    await nextAuthWebAuthn("webauthn", {
      action: "authenticate",
      callbackUrl: opts?.callbackUrl ?? "/account",
    });
  },
};
