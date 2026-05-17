import type { Subscription } from "@/server/domain/billing";

export type SubscriptionUpsertInput = Readonly<{
  userId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}>;

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription | null>;
  upsertFromStripe(input: SubscriptionUpsertInput): Promise<void>;
}
