import { container } from "@/server/container";

export default async function DashboardPage() {
  const session = await container().sessions.getSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          ようこそ、{session?.user?.name ?? session?.user?.email} さん
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground text-sm">アクティブユーザー</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground text-sm">今月の売上</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground text-sm">プラン</p>
          <p className="mt-2 text-3xl font-bold">Free</p>
        </div>
      </div>
    </div>
  );
}
