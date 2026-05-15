import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="container flex flex-1 flex-col items-center justify-center gap-8 py-24 text-center">
        <div className="bg-muted/40 text-muted-foreground inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide">
          中規模SaaSまで耐えうるスターター
        </div>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-balance md:text-6xl">
          Webサービスを今日から作り始める。
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-balance">
          Next.js / Prisma / Auth.js / Stripe / Resend / Sentry / PostHog
          が組み込み済みの実戦投入向けスターター。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">ダッシュボードへ</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">サインイン</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
