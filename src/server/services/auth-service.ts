import { z } from "zod";

import { AppError, RateLimitedError } from "@/server/domain/errors";
import type { RateLimiter } from "@/server/ports/rate-limiter";
import type { OAuthProvider, SignInGateway } from "@/server/ports/sign-in-gateway";

const emailSchema = z.string().email().max(254);

export class InvalidEmailError extends AppError {
  constructor() {
    super("INVALID_EMAIL", "Invalid email address");
  }
}

export interface AuthService {
  // On success implementations throw NEXT_REDIRECT — callers must let it propagate.
  signInWithEmail(input: { email: string; ip: string; redirectTo: string }): Promise<void>;
  signInWithOAuth(input: {
    provider: OAuthProvider;
    ip: string;
    redirectTo: string;
  }): Promise<void>;
}

export function makeAuthService(deps: {
  signIn: SignInGateway;
  emailLimiter: RateLimiter;
  oauthLimiter: RateLimiter;
}): AuthService {
  const { signIn, emailLimiter, oauthLimiter } = deps;

  return {
    async signInWithEmail({ email, ip, redirectTo }) {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) throw new InvalidEmailError();

      const { success } = await emailLimiter.limit(ip);
      if (!success) throw new RateLimitedError();

      await signIn.withEmail({ email: parsed.data, redirectTo });
    },

    async signInWithOAuth({ provider, ip, redirectTo }) {
      const { success } = await oauthLimiter.limit(ip);
      if (!success) throw new RateLimitedError();
      await signIn.withOAuth({ provider, redirectTo });
    },
  };
}
