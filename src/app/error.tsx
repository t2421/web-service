"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-bold">予期せぬエラーが発生しました</h1>
      <p className="text-muted-foreground max-w-md">
        問題は自動的に記録されました。お手数ですが再試行してください。
      </p>
      {error.digest ? (
        <code className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
          {error.digest}
        </code>
      ) : null}
      <Button onClick={() => reset()}>再試行</Button>
    </main>
  );
}
