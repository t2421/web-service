import { isMockModeEnabled } from "@/lib/mock-mode";
import { nextAuthMiddleware } from "@/server/adapters/nextauth/auth-middleware";
import { mockAuthMiddleware } from "@/server/adapters/mock/auth-middleware";
import type { AuthMiddleware } from "@/server/ports/auth-middleware";

// Edge runtime composition root. Must NOT import Node-only modules (Prisma, Resend, fs).
// Mirrors the Node-side container but only exposes Edge-safe ports.
export const edgeContainer: Readonly<{ middleware: AuthMiddleware }> = {
  middleware: isMockModeEnabled() ? mockAuthMiddleware : nextAuthMiddleware,
};
