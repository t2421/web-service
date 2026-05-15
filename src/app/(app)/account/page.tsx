import { auth } from "@/lib/auth";
import { AccountForm } from "@/components/account/account-form";

export const metadata = {
  title: "マイページ",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">マイページ</h1>
        <p className="text-muted-foreground">プロフィールとアカウント設定</p>
      </div>
      <AccountForm user={session.user} />
    </div>
  );
}
