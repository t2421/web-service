import { cookies } from "next/headers";

import "server-only";
import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  parseMockUser,
  serializeMockUser,
  type MockUser,
} from "@/lib/mock-mode";
import { MOCK_COOKIE_OPTIONS } from "@/server/domain/constants";

export async function readMockUser(): Promise<MockUser | null> {
  const store = await cookies();
  return parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value);
}

// Merge a partial patch into the current mock user and persist the new state.
// Used by both the sign-in and billing mock gateways so cookie shape and
// options stay consistent.
export async function writeMockUser(patch: Partial<MockUser>): Promise<MockUser> {
  const store = await cookies();
  const current = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value) ?? DEFAULT_MOCK_USER;
  const next: MockUser = { ...current, ...patch };
  store.set(MOCK_SESSION_COOKIE, serializeMockUser(next), MOCK_COOKIE_OPTIONS);
  return next;
}
