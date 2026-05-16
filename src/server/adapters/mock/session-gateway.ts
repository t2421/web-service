import { cookies } from "next/headers";

import "server-only";
import { MOCK_SESSION_COOKIE, parseMockUser } from "@/lib/mock-mode";
import type { AuthSession } from "@/server/domain/auth";
import type { SessionGateway } from "@/server/ports/session-gateway";

export function makeMockSessionGateway(): SessionGateway {
  return {
    async getSession() {
      const store = await cookies();
      const mockUser = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value);
      if (!mockUser) return null;
      const session: AuthSession = {
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          image: mockUser.image,
          role: mockUser.role,
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      return session;
    },
  };
}
