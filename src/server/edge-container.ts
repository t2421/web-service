import { isMockModeEnabled } from "@/lib/mock-mode";
import { withCsp } from "@/server/adapters/csp-middleware";
import { nextAuthMiddleware } from "@/server/adapters/nextauth/auth-middleware";
import { mockAuthMiddleware } from "@/server/adapters/mock/auth-middleware";
import type { AuthMiddleware } from "@/server/ports/auth-middleware";

// Edge runtime composition root. Must NOT import Node-only modules (Prisma, Resend, fs).
// Mirrors the Node-side container but only exposes Edge-safe ports.
const authMiddleware = isMockModeEnabled() ? mockAuthMiddleware : nextAuthMiddleware;

export const edgeContainer: Readonly<{ middleware: AuthMiddleware }> = {
  // Wrap auth with CSP so every page request gets a per-request nonce and a
  // strict, nonce-based Content-Security-Policy header.
  middleware: withCsp(authMiddleware),
};
