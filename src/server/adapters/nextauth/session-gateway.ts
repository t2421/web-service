import type { Session } from "next-auth";

import "server-only";
import type { AuthSession, UserRole } from "@/server/domain/auth";
import type { SessionGateway } from "@/server/ports/session-gateway";

type SessionLoader = () => Promise<Session | null>;

export function makeNextAuthSessionGateway(load: SessionLoader): SessionGateway {
  return {
    async getSession() {
      const session = await load();
      if (!session?.user?.id) return null;
      const result: AuthSession = {
        user: {
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
          role: ((session.user as { role?: string }).role as UserRole | undefined) ?? "USER",
        },
        expiresAt: new Date(session.expires),
      };
      return result;
    },
  };
}
