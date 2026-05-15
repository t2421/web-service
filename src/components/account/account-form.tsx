"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { signIn as signInWebAuthn } from "next-auth/webauthn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

function PasskeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17 8C17 10.761 14.761 13 12 13C9.239 13 7 10.761 7 8C7 5.239 9.239 3 12 3C14.761 3 17 5.239 17 8ZM12 11C13.657 11 15 9.657 15 8C15 6.343 13.657 5 12 5C10.343 5 9 6.343 9 8C9 9.657 10.343 11 12 11Z" />
      <path d="M6.343 14.757C7.966 13.619 9.919 13 12 13C14.081 13 16.034 13.619 17.657 14.757C18.499 15.337 19.226 16.073 19.782 16.931L18.072 18C17.646 17.358 17.093 16.797 16.447 16.354C15.192 15.5 13.637 15 12 15C10.363 15 8.808 15.5 7.553 16.354C6.907 16.797 6.354 17.358 5.928 18L4.218 16.931C4.774 16.073 5.501 15.337 6.343 14.757Z" />
      <path d="M20 19H21V21H3V19H4V18L6 19.5V21H18V19.5L20 18V19Z" />
    </svg>
  );
}

export function AccountForm({ user }: { user: User }) {
  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();
  const [passkeyPending, startPasskeyTransition] = useTransition();

  function handleRegisterPasskey() {
    startPasskeyTransition(async () => {
      try {
        await signInWebAuthn("webauthn", { action: "register" });
        toast.success("パスキーを登録しました。");
      } catch {
        toast.error("パスキーの登録に失敗しました。");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="bg-card rounded-lg border p-6">
        <h2 className="mb-4 font-semibold">プロフィール</h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user.image ? <AvatarImage src={user.image} alt={user.name ?? ""} /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name ?? "名前未設定"}</p>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">表示名</Label>
            <Input id="name" defaultValue={user.name ?? ""} placeholder="名前を入力" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" defaultValue={user.email ?? ""} disabled />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-lg border p-6">
        <h2 className="mb-1 font-semibold">アカウント情報</h2>
        <p className="text-muted-foreground mb-4 text-sm">ユーザー ID: {user.id}</p>
      </section>

      <section className="bg-card rounded-lg border p-6">
        <h2 className="mb-1 font-semibold">パスキー</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          このデバイスの生体認証（Touch ID / Face ID / Windows Hello
          など）でサインインできるようになります。
        </p>
        <Button variant="outline" onClick={handleRegisterPasskey} disabled={passkeyPending}>
          <PasskeyIcon className="mr-2 size-4" />
          {passkeyPending ? "登録中..." : "パスキーを追加"}
        </Button>
      </section>

      <section className="border-destructive/30 bg-card rounded-lg border p-6">
        <h2 className="text-destructive mb-1 font-semibold">サインアウト</h2>
        <p className="text-muted-foreground mb-4 text-sm">このデバイスからサインアウトします。</p>
        <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
          サインアウト
        </Button>
      </section>
    </div>
  );
}
