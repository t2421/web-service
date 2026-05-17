import "server-only";
import type { AuthHandlers } from "@/server/ports/auth-handlers";
import type { NextAuthInstance } from "@/server/adapters/nextauth/full-instance";

export function makeNextAuthHandlers(instance: NextAuthInstance): AuthHandlers {
  return {
    GET: instance.handlers.GET,
    POST: instance.handlers.POST,
  };
}
