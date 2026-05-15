import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="container flex flex-1 flex-col items-center justify-center gap-8 py-24 text-center">
        <div className="inline-flex items-center rounded-full border bg-muted/40 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          中規模SaaSまで耐えうるスターター
        </div>
        <h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight md:text-6xl">
          Webサービスを今日から作り始める。
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
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
