import type { Plan } from "@/server/domain/billing";

export type CheckoutInput = Readonly<{
  userId: string;
  email: string;
  plan: Plan;
  existingCustomerId: string | null;
  successPath: string;
  cancelPath: string;
}>;

export type CheckoutResult = Readonly<{
  url: string;
  customerId: string;
}>;

export type PortalInput = Readonly<{
  customerId: string;
  returnPath: string;
}>;

export interface BillingGateway {
  createCheckoutUrl(input: CheckoutInput): Promise<CheckoutResult>;
  createPortalUrl(input: PortalInput): Promise<{ url: string }>;
  // 退会フローで使用。即時解約(日割りなし)を想定。
  cancelSubscription(subscriptionId: string): Promise<void>;
}
