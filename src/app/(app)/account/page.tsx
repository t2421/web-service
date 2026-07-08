import { container } from "@/server/container";
import { AccountForm } from "@/components/account/account-form";

export const metadata = {
  title: "マイページ",
};

export default async function AccountPage() {
  // JWT セッションはサインイン時点のプロフィールをキャッシュするため、
  // 表示は AccountService 経由で DB の最新値を取得する。
  const profile = await container().accountService.getProfile();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">マイページ</h1>
        <p className="text-muted-foreground">プロフィールとアカウント設定</p>
      </div>
      <AccountForm user={profile} />
    </div>
  );
}
