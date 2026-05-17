"use client";

import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { GitHubIcon, PasskeyIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePendingActions } from "@/hooks/use-pending-actions";
import { signInWithEmail, signInWithOAuth } from "@/server/actions/auth";

type AuthMethod = "email" | "oauth" | "passkey";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const { isPending, pendingKey, start } = usePendingActions<AuthMethod>();

  function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    start("email", async () => {
      const result = await signInWithEmail(email);
      if (!result.success) toast.error(result.error.message);
    });
  }

  function handleOAuth(provider: "github" | "google") {
    start("oauth", async () => {
      const result = await signInWithOAuth(provider);
      if (!result.success) toast.error(result.error.message);
    });
  }

  function handlePasskey() {
    start("passkey", async () => {
      try {
        await authClient.authenticateWithPasskey({ callbackUrl: "/account" });
      } catch {
        toast.error("パスキー認証に失敗しました。");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleEmail} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isPending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {pendingKey === "email" ? "送信中..." : "メールでサインイン"}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card text-muted-foreground px-2">または</span>
        </div>
      </div>
      <div className="grid gap-2">
        <Button variant="outline" onClick={handlePasskey} disabled={isPending} className="w-full">
          <PasskeyIcon className="mr-2 size-4" />
          {pendingKey === "passkey" ? "認証中..." : "パスキーでサインイン"}
        </Button>
        <Button variant="outline" onClick={() => handleOAuth("github")} disabled={isPending}>
          <GitHubIcon className="mr-2 size-4" />
          GitHub でサインイン
        </Button>
        <Button variant="outline" onClick={() => handleOAuth("google")} disabled={isPending}>
          Google でサインイン
        </Button>
      </div>
    </div>
  );
}
