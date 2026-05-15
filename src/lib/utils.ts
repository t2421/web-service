import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "JPY",
  locale = "ja-JP",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, locale = "ja-JP"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
