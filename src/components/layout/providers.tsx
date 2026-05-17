"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { PostHogProvider } from "@/components/layout/posthog-provider";

export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  // CSP nonce forwarded from RootLayout. next-themes injects an inline FOUC-prevention
  // <script> into <body>; without the nonce it would be blocked by our strict CSP.
  nonce?: string;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        nonce={nonce}
      >
        <QueryClientProvider client={queryClient}>
          <PostHogProvider>{children}</PostHogProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
