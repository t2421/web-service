import "server-only";
import type { UserRepository } from "@/server/ports/user-repository";

// E2E mock: users are scoped to the mock session cookie, so there's no separate
// persistence layer to read. setStripeCustomerId is a no-op.
export function makeMockUserRepository(): UserRepository {
  return {
    async findById(id) {
      return { id, email: null, stripeCustomerId: null };
    },
    async setStripeCustomerId() {
      // intentional no-op
    },
  };
}
