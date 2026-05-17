import type { Session } from "next-auth";

import "server-only";
import { toAuthSession } from "@/server/domain/auth";
import type { SessionGateway } from "@/server/ports/session-gateway";

type SessionLoader = () => Promise<Session | null>;

export function makeNextAuthSessionGateway(load: SessionLoader): SessionGateway {
  return {
    async getSession() {
      const session = await load();
      if (!session?.user?.id) return null;
      return toAuthSession({
        user: { ...session.user, id: session.user.id },
        expiresAt: new Date(session.expires),
      });
    },
  };
}
