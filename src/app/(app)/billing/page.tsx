import { container } from "@/server/container";
import { BillingPanel } from "@/components/billing/billing-panel";

// Authentication is enforced by `(app)/layout.tsx`; see the comment in
// account/page.tsx for details.
export default async function BillingPage() {
  const subscription = await container().billingService.getCurrentSubscription();

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
