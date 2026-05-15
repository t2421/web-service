import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BillingPanel } from "@/components/billing/billing-panel";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

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
