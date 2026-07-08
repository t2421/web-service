import type { Session } from "next-auth";

import "server-only";
import type { AuthSession, UserRole } from "@/server/domain/auth";
import type { SessionGateway } from "@/server/ports/session-gateway";

type SessionLoader = () => Promise<Session | null>;
// NextAuth インスタンスの signOut。redirect: false でセッション cookie の削除のみ行う。
type SessionDestroyer = (options: { redirect: false }) => Promise<unknown>;

export function makeNextAuthSessionGateway(deps: {
  load: SessionLoader;
  destroy: SessionDestroyer;
}): SessionGateway {
  return {
    async getSession() {
      const session = await deps.load();
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

    async destroySession() {
      // Cookie の書き込みは Server Action / Route Handler 内でのみ許可される。
      // destroySession はその文脈から呼ばれる前提。
      await deps.destroy({ redirect: false });
    },
  };
}
