"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PasskeyIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/section-card";
import { getInitials } from "@/lib/initials";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AccountForm({ user }: { user: User }) {
  const initials = getInitials(user.name, user.email);
  const [passkeyPending, startPasskeyTransition] = useTransition();

  function handleRegisterPasskey() {
    startPasskeyTransition(async () => {
      try {
        await authClient.registerPasskey();
        toast.success("パスキーを登録しました。");
      } catch {
        toast.error("パスキーの登録に失敗しました。");
      }
    });
  }

  return (
    <div className="space-y-8">
      <SectionCard>
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
            {/* Read-only: server-side editing not wired up yet. */}
            <Input id="name" defaultValue={user.name ?? ""} placeholder="名前を入力" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" defaultValue={user.email ?? ""} disabled />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-1 font-semibold">アカウント情報</h2>
        <p className="text-muted-foreground mb-4 text-sm">ユーザー ID: {user.id}</p>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-1 font-semibold">パスキー</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          このデバイスの生体認証（Touch ID / Face ID / Windows Hello
          など）でサインインできるようになります。
        </p>
        <Button variant="outline" onClick={handleRegisterPasskey} disabled={passkeyPending}>
          <PasskeyIcon className="mr-2 size-4" />
          {passkeyPending ? "登録中..." : "パスキーを追加"}
        </Button>
      </SectionCard>

      <SectionCard className="border-destructive/30">
        <h2 className="text-destructive mb-1 font-semibold">サインアウト</h2>
        <p className="text-muted-foreground mb-4 text-sm">このデバイスからサインアウトします。</p>
        <Button variant="destructive" onClick={() => authClient.signOut({ callbackUrl: "/" })}>
          サインアウト
        </Button>
      </SectionCard>
    </div>
  );
}
