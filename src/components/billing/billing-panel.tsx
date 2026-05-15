"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createCheckoutSession, createPortalSession } from "@/server/actions/billing";

type Subscription = {
  status: string;
  priceId: string | null;
  currentPeriodEnd: Date | null;
} | null;

export function BillingPanel({ subscription }: { subscription: Subscription }) {
  const [pending, startTransition] = useTransition();
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  function toSafeStripeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      const { origin } = new URL(url);
      const allowed = ["https://checkout.stripe.com", "https://billing.stripe.com"];
      return allowed.includes(origin) ? url : null;
    } catch {
      return null;
    }
  }

  function handleCheckout(plan: "monthly" | "yearly") {
    startTransition(async () => {
      const result = await createCheckoutSession({ plan });
      const url = toSafeStripeUrl("url" in result ? result.url : null);
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Checkout URL を作成できませんでした");
      }
    });
  }

  function handlePortal() {
    startTransition(async () => {
      const result = await createPortalSession();
      const url = toSafeStripeUrl("url" in result ? result.url : null);
      if (url) {
        window.location.href = url;
      } else {
        toast.error("ポータルを開けませんでした");
      }
    });
  }

  if (isActive) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="font-medium">Pro プランがアクティブです</p>
        <p className="mt-1 text-sm text-muted-foreground">
          次回更新: {subscription?.currentPeriodEnd?.toLocaleDateString("ja-JP")}
        </p>
        <Button onClick={handlePortal} disabled={pending} className="mt-4">
          支払い情報を管理
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-6">
        <p className="text-lg font-semibold">Pro 月額</p>
        <p className="mt-1 text-sm text-muted-foreground">月単位で柔軟に</p>
        <Button onClick={() => handleCheckout("monthly")} disabled={pending} className="mt-4">
          アップグレード
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-6">
        <p className="text-lg font-semibold">Pro 年額</p>
        <p className="mt-1 text-sm text-muted-foreground">2 ヶ月分お得</p>
        <Button onClick={() => handleCheckout("yearly")} disabled={pending} className="mt-4">
          アップグレード
        </Button>
      </div>
    </div>
  );
}
