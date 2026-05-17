import "server-only";
import { readMockUser } from "@/server/adapters/mock/cookie-helpers";
import type { AuthSession } from "@/server/domain/auth";
import { SESSION_MAX_AGE_MS } from "@/server/domain/constants";
import type { SessionGateway } from "@/server/ports/session-gateway";

export function makeMockSessionGateway(): SessionGateway {
  return {
    async getSession() {
      const mockUser = await readMockUser();
      if (!mockUser) return null;
      const session: AuthSession = {
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          image: mockUser.image,
          role: mockUser.role,
        },
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
      };
      return session;
    },
  };
}
