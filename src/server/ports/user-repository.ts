export type UserRecord = Readonly<{
  id: string;
  name: string | null;
  email: string | null;
  stripeCustomerId: string | null;
}>;

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  updateName(id: string, name: string): Promise<void>;
  setStripeCustomerId(id: string, customerId: string): Promise<void>;
  // 関連レコード(accounts / subscriptions / authenticators)は DB 側の
  // onDelete: Cascade で一括削除される前提。
  deleteById(id: string): Promise<void>;
}
