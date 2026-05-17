import "server-only";
import { readMockUser } from "@/server/adapters/mock/cookie-helpers";
import { toAuthSession } from "@/server/domain/auth";
import { SESSION_MAX_AGE_MS } from "@/server/domain/constants";
import type { SessionGateway } from "@/server/ports/session-gateway";

export function makeMockSessionGateway(): SessionGateway {
  return {
    async getSession() {
      const mockUser = await readMockUser();
      if (!mockUser) return null;
      return toAuthSession({
        user: mockUser,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
      });
    },
  };
}
