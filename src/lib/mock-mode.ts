import type { Session } from "next-auth";

import { SESSION_MAX_AGE_MS } from "@/server/domain/constants";

export const MOCK_SESSION_COOKIE = "__e2e_mock_user";

export type MockSubscriptionState = "free" | "active";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
  subscription: MockSubscriptionState;
};

export const DEFAULT_MOCK_USER: MockUser = {
  id: "e2e-user-1",
  name: "E2E Test User",
  email: "e2e@example.com",
  image: null,
  role: "USER",
  subscription: "free",
};

let warned = false;
export function isMockModeEnabled(): boolean {
  const enabled = process.env.E2E_MOCK_MODE === "1";
  // Loud, one-shot warning so accidental production enablement is obvious in logs.
  if (enabled && !warned && typeof window === "undefined") {
    warned = true;
    console.warn(
      "[mock-mode] E2E_MOCK_MODE=1 is set. Authentication and Stripe are stubbed for testing. " +
        "This MUST NOT be set in real production environments.",
    );
  }
  return enabled;
}

export function parseMockUser(raw: string | undefined): MockUser | null {
  if (!raw) return null;
  // Cookie values come pre-decoded from `cookies().get(...)?.value`, so the
  // payload should already be the original JSON. We keep a defensive fallback
  // for legacy URL-encoded values stored by older code.
  try {
    const text = raw.startsWith("{") ? raw : decodeURIComponent(raw);
    const decoded = JSON.parse(text) as unknown;
    if (!decoded || typeof decoded !== "object") return null;
    return { ...DEFAULT_MOCK_USER, ...(decoded as Partial<MockUser>) };
  } catch {
    return null;
  }
}

export function serializeMockUser(user: MockUser): string {
  // Cookie middleware URL-encodes on its own; store raw JSON.
  return JSON.stringify(user);
}

export function mockSessionFromUser(user: MockUser): Session {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    },
    expires: new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString(),
  };
}
