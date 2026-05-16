import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MOCK_SESSION_COOKIE, isMockModeEnabled, parseMockUser } from "@/lib/mock-mode";
import { BillingPanel } from "@/components/billing/billing-panel";

type Subscription = {
  status: string;
  priceId: string | null;
  currentPeriodEnd: Date | null;
} | null;

async function getMockSubscription(): Promise<Subscription> {
  const store = await cookies();
  const mockUser = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value);
  if (!mockUser || mockUser.subscription !== "active") return null;
  return {
    status: "active",
    priceId: "price_mock_pro_monthly",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const subscription: Subscription = isMockModeEnabled()
    ? await getMockSubscription()
    : await prisma.subscription.findUnique({ where: { userId: session.user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">請求</h1>
        <p className="text-muted-foreground">プランの確認と支払い方法の管理</p>
      </div>
      <BillingPanel subscription={subscription} />
    </div>
  );
}
