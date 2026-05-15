import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "サインイン",
};

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">サインイン</h1>
        <p className="text-muted-foreground text-sm">
          メールアドレスかソーシャルアカウントでログイン
        </p>
      </div>
      <SignInForm />
    </div>
  );
}
