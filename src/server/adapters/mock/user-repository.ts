import "server-only";
import type { UserRepository } from "@/server/ports/user-repository";

// E2E mock: users are scoped to the mock session cookie, so there's no separate
// persistence layer to read. Writes are no-ops; lookups always return a stub.
export function makeMockUserRepository(): UserRepository {
  return {
    async findById(id) {
      return { id, email: null, stripeCustomerId: null };
    },
    async findByStripeCustomerId() {
      return null;
    },
    async setStripeCustomerId() {
      // intentional no-op
    },
  };
}
