// Domain-wide constants. Edge-safe: no Node-only imports — usable from both
// the Node container and the Edge middleware bundle.

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export const PROTECTED_PATHS = ["/dashboard", "/billing", "/settings", "/account"] as const;

export const MOCK_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;
