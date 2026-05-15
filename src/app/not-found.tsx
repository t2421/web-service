import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-sm font-medium tracking-widest text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold">ページが見つかりません</h1>
      <p className="max-w-md text-muted-foreground">
        URL が間違っているか、ページが削除された可能性があります。
      </p>
      <Button asChild>
        <Link href="/">ホームに戻る</Link>
      </Button>
    </main>
  );
}
