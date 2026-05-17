import { container } from "@/server/container";
import { AccountForm } from "@/components/account/account-form";

export const metadata = {
  title: "マイページ",
};

// Authentication is enforced by `(app)/layout.tsx`, which redirects to /sign-in
// when there is no session. Page components can therefore assume a user exists.
export default async function AccountPage() {
  const session = await container().sessions.getSession();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">マイページ</h1>
        <p className="text-muted-foreground">プロフィールとアカウント設定</p>
      </div>
      <AccountForm user={session!.user} />
    </div>
  );
}
