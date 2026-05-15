"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <h1>致命的なエラーが発生しました</h1>
          <p>ページをリロードしてください。</p>
        </main>
      </body>
    </html>
  );
}
