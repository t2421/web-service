import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";

import { Providers } from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Web Service",
    template: "%s | Web Service",
  },
  description: "A modern SaaS starter built with Next.js.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "Web Service",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading headers() opts every page into dynamic rendering. This lets the
  // Edge middleware's per-request CSP nonce (set as x-nonce) reach Next.js's
  // renderer, which stamps the nonce onto its own inline RSC bootstrap scripts.
  // Without dynamic rendering, statically generated pages would ship un-nonced
  // inline scripts and the strict CSP would block them.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-background min-h-screen font-sans`}
        suppressHydrationWarning
      >
        <Providers nonce={nonce}>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
