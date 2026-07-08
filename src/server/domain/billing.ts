export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "paused"
  | "unpaid";

export type Plan = "monthly" | "yearly";

export type Subscription = Readonly<{
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  priceId: string | null;
  currentPeriodEnd: Date | null;
}>;

export function isSubscriptionActive(s: Subscription | null): boolean {
  return s?.status === "active" || s?.status === "trialing";
}
