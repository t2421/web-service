import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import "server-only";
import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  parseMockUser,
  serializeMockUser,
  type MockUser,
} from "@/lib/mock-mode";
import type { SignInGateway } from "@/server/ports/sign-in-gateway";

async function writeMockSession(patch: Partial<MockUser>) {
  const store = await cookies();
  const current = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value) ?? DEFAULT_MOCK_USER;
  const next: MockUser = { ...current, ...patch };
  store.set(MOCK_SESSION_COOKIE, serializeMockUser(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function makeMockSignInGateway(): SignInGateway {
  return {
    async withEmail({ email, redirectTo }) {
      await writeMockSession({ email });
      redirect(redirectTo);
    },
    async withOAuth({ redirectTo }) {
      await writeMockSession({});
      redirect(redirectTo);
    },
  };
}
