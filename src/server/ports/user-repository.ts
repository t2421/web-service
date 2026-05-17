export type UserRecord = Readonly<{
  id: string;
  email: string | null;
  stripeCustomerId: string | null;
}>;

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByStripeCustomerId(customerId: string): Promise<UserRecord | null>;
  setStripeCustomerId(id: string, customerId: string): Promise<void>;
}
