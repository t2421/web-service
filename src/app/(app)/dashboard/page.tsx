import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          ようこそ、{session?.user?.name ?? session?.user?.email} さん
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">アクティブユーザー</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">今月の売上</p>
          <p className="mt-2 text-3xl font-bold">—</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">プラン</p>
          <p className="mt-2 text-3xl font-bold">Free</p>
        </div>
      </div>
    </div>
  );
}
