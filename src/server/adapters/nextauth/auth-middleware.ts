import NextAuth from "next-auth";

import { nextAuthEdgeConfig } from "@/server/adapters/nextauth/edge-config";
import type { AuthMiddleware } from "@/server/ports/auth-middleware";

// Wrap NextAuth's middleware (Edge-safe, no DB) as a generic AuthMiddleware.
// Building it once at module load mirrors NextAuth's documented usage pattern.
const { auth } = NextAuth(nextAuthEdgeConfig);

export const nextAuthMiddleware: AuthMiddleware = auth as unknown as AuthMiddleware;
