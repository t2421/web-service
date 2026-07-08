import { cookies } from "next/headers";

import "server-only";
import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  parseMockUser,
  serializeMockUser,
} from "@/lib/mock-mode";
import type { UserRepository } from "@/server/ports/user-repository";

// E2E mock: users are backed by the mock session cookie so profile updates and
// account deletion are observable from Playwright without a database.
// Cookie writes only work inside Server Actions / Route Handlers — which is
// exactly where updateName / deleteById are called from.
export function makeMockUserRepository(): UserRepository {
  return {
    async findById(id) {
      const store = await cookies();
      const user = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value);
      if (!user) return { id, name: null, email: null, stripeCustomerId: null };
      return { id: user.id, name: user.name, email: user.email, stripeCustomerId: null };
    },
    async updateName(_id, name) {
      const store = await cookies();
      const current = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value) ?? DEFAULT_MOCK_USER;
      store.set(MOCK_SESSION_COOKIE, serializeMockUser({ ...current, name }), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    },
    async setStripeCustomerId() {
      // intentional no-op
    },
    async deleteById() {
      const store = await cookies();
      store.delete(MOCK_SESSION_COOKIE);
    },
  };
}
