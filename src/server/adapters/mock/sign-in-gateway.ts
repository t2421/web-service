import { redirect } from "next/navigation";

import "server-only";
import { writeMockUser } from "@/server/adapters/mock/cookie-helpers";
import type { SignInGateway } from "@/server/ports/sign-in-gateway";

export function makeMockSignInGateway(): SignInGateway {
  return {
    async withEmail({ email, redirectTo }) {
      await writeMockUser({ email });
      redirect(redirectTo);
    },
    async withOAuth({ redirectTo }) {
      await writeMockUser({});
      redirect(redirectTo);
    },
  };
}
