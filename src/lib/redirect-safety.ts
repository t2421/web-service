// Allowlist of external redirect destinations after a Stripe Checkout / Portal
// call. Centralising here prevents a stray Server Action result from
// open-redirecting the browser.
const ALLOWED_EXTERNAL_ORIGINS: ReadonlySet<string> = new Set([
  "https://checkout.stripe.com",
  "https://billing.stripe.com",
]);

export function toSafeRedirect(url: string | null | undefined): string | null {
  if (!url) return null;
  // Same-origin relative paths are intrinsically safe (used by the E2E mock mode).
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const { origin } = new URL(url);
    return ALLOWED_EXTERNAL_ORIGINS.has(origin) ? url : null;
  } catch {
    return null;
  }
}
