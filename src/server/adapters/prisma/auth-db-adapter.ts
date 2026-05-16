import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

import "server-only";

// Adapts a Prisma client into a NextAuth-compatible storage adapter. Swapping ORMs
// means replacing this file with @auth/drizzle-adapter or @auth/mongodb-adapter and
// updating container.ts — no other code in the codebase changes.
export function makePrismaAuthDbAdapter(prisma: PrismaClient): Adapter {
  return PrismaAdapter(prisma);
}
