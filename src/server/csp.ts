// Edge-safe CSP helpers. Must not import Node-only modules.

// Per-request random nonce. Using Web Crypto so the helper works in both
// Edge and Node runtimes. 16 random bytes (128 bits) is the OWASP-recommended
// minimum; base64 makes it CSP-safe.
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Strict, nonce-based CSP. Notes:
// - `'strict-dynamic'` makes browsers trust scripts loaded by already-trusted
//   (nonce'd) scripts, which lets Next.js's async chunk loader work without
//   listing every chunk hash. With strict-dynamic, host expressions and
//   `'unsafe-inline'` are intentionally ignored by the browser — the policy is
//   reduced to "only scripts carrying the per-request nonce may execute".
// - styles still need `'unsafe-inline'` because Next.js / Tailwind emit inline
//   `<style>` tags and dynamic style attributes that can't all be nonce'd
//   without runtime overhead. Styles can't execute code, so this is acceptable.
export function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.posthog.com https://us.i.posthog.com https://*.sentry.io",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
