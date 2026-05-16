import "server-only";
import type { SignInGateway } from "@/server/ports/sign-in-gateway";

type NextAuthSignIn = (
  provider: string,
  options: { email?: string; redirectTo: string },
) => Promise<unknown>;

export function makeNextAuthSignInGateway(signIn: NextAuthSignIn): SignInGateway {
  return {
    async withEmail({ email, redirectTo }) {
      await signIn("resend", { email, redirectTo });
    },
    async withOAuth({ provider, redirectTo }) {
      await signIn(provider, { redirectTo });
    },
  };
}
