import type { Subscription } from "@/server/domain/billing";

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
}
