"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export function AppHeader({ user }: AppHeaderProps) {
  const initials = (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Web Service
          </Link>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            ダッシュボード
          </Link>
          <Link
            href="/billing"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            請求
          </Link>
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                {user.image ? <AvatarImage src={user.image} alt={user.name ?? ""} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium">{user.name ?? "—"}</p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User className="mr-2 size-4" /> マイページ
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 size-4" /> サインアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
