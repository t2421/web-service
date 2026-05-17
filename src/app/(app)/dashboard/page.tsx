import { SectionCard } from "@/components/ui/section-card";
import { container } from "@/server/container";

// Authentication is enforced by `(app)/layout.tsx`.
export default async function DashboardPage() {
  const session = await container().sessions.getSession();
  const user = session!.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">ようこそ、{user.name ?? user.email} さん</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard as="div">
          <p className="text-muted-foreground text-sm">アクティブユーザー</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </SectionCard>
        <SectionCard as="div">
          <p className="text-muted-foreground text-sm">今月の売上</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </SectionCard>
        <SectionCard as="div">
          <p className="text-muted-foreground text-sm">プラン</p>
          <p className="mt-2 text-3xl font-bold">Free</p>
        </SectionCard>
      </div>
    </div>
  );
}
