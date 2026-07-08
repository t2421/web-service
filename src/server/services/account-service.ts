import { z } from "zod";

import { isSubscriptionActive } from "@/server/domain/billing";
import { AppError, UnauthorizedError } from "@/server/domain/errors";
import type { AuditLogger } from "@/server/ports/audit-logger";
import type { BillingGateway } from "@/server/ports/billing-gateway";
import type { SessionGateway } from "@/server/ports/session-gateway";
import type { SubscriptionRepository } from "@/server/ports/subscription-repository";
import type { UserRepository } from "@/server/ports/user-repository";

export const NAME_MAX_LENGTH = 100;

const nameSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);

export class InvalidNameError extends AppError {
  constructor() {
    super("INVALID_NAME", "Invalid display name");
  }
}

export type Profile = Readonly<{
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}>;

export interface AccountService {
  // JWT セッションはサインイン時点の名前をキャッシュするため、
  // プロフィール表示は DB を正とし、セッションはフォールバックに使う。
  getProfile(): Promise<Profile | null>;
  updateProfile(input: { name: string }): Promise<void>;
  // アクティブな Stripe サブスクリプションを解約 → ユーザー削除 → セッション失効。
  // 解約に失敗した場合は削除を中断する(削除済みユーザーへの課金を防ぐ)。
  // JWT セッションは DB を見ないため、サーバー側での cookie 失効が必須
  // (クライアントの signOut 任せにすると失敗時にゴーストセッションが残る)。
  deleteAccount(): Promise<void>;
}

export function makeAccountService(deps: {
  sessions: SessionGateway;
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  billing: BillingGateway;
  audit: AuditLogger;
}): AccountService {
  const { sessions, users, subscriptions, billing, audit } = deps;

  return {
    async getProfile() {
      const session = await sessions.getSession();
      if (!session?.user?.id) return null;
      const user = await users.findById(session.user.id);
      return {
        id: session.user.id,
        name: user?.name ?? session.user.name ?? null,
        email: user?.email ?? session.user.email ?? null,
        image: session.user.image ?? null,
      };
    },

    async updateProfile({ name }) {
      const session = await sessions.getSession();
      if (!session?.user?.id) throw new UnauthorizedError();

      const parsed = nameSchema.safeParse(name);
      if (!parsed.success) throw new InvalidNameError();

      await users.updateName(session.user.id, parsed.data);
      await audit.record({
        userId: session.user.id,
        action: "account.profile_updated",
        metadata: { name: parsed.data },
      });
    },

    async deleteAccount() {
      const session = await sessions.getSession();
      if (!session?.user?.id) throw new UnauthorizedError();
      const userId = session.user.id;

      const subscription = await subscriptions.findByUserId(userId);
      if (isSubscriptionActive(subscription) && subscription?.stripeSubscriptionId) {
        await billing.cancelSubscription(subscription.stripeSubscriptionId);
      }

      await users.deleteById(userId);
      await sessions.destroySession();
      await audit.record({
        userId,
        action: "account.deleted",
        metadata: { email: session.user.email ?? null },
      });
    },
  };
}
