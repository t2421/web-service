import { describe, expect, it } from "vitest";

import { RateLimitedError } from "@/server/domain/errors";
import type { RateLimiter } from "@/server/ports/rate-limiter";
import type { SignInGateway } from "@/server/ports/sign-in-gateway";
import { InvalidEmailError, makeAuthService } from "@/server/services/auth-service";

function fakeLimiter(success: boolean): { limiter: RateLimiter; keys: string[] } {
  const keys: string[] = [];
  const limiter: RateLimiter = {
    limit: async (key) => {
      keys.push(key);
      return { success };
    },
  };
  return { limiter, keys };
}

function fakeSignIn(): {
  gateway: SignInGateway;
  emailCalls: Array<{ email: string; redirectTo: string }>;
  oauthCalls: Array<{ provider: string; redirectTo: string }>;
} {
  const emailCalls: Array<{ email: string; redirectTo: string }> = [];
  const oauthCalls: Array<{ provider: string; redirectTo: string }> = [];
  const gateway: SignInGateway = {
    withEmail: async (input) => {
      emailCalls.push(input);
    },
    withOAuth: async (input) => {
      oauthCalls.push(input);
    },
  };
  return { gateway, emailCalls, oauthCalls };
}

function makeService(opts: { emailAllowed?: boolean; oauthAllowed?: boolean } = {}) {
  const signIn = fakeSignIn();
  const email = fakeLimiter(opts.emailAllowed ?? true);
  const oauth = fakeLimiter(opts.oauthAllowed ?? true);
  const service = makeAuthService({
    signIn: signIn.gateway,
    emailLimiter: email.limiter,
    oauthLimiter: oauth.limiter,
  });
  return { service, signIn, email, oauth };
}

describe("AuthService.signInWithEmail", () => {
  it("rejects an invalid email before hitting the rate limiter", async () => {
    const { service, email } = makeService();
    await expect(
      service.signInWithEmail({ email: "not-an-email", ip: "1.2.3.4", redirectTo: "/account" }),
    ).rejects.toBeInstanceOf(InvalidEmailError);
    expect(email.keys).toEqual([]);
  });

  it("throws RateLimitedError when the limiter denies the ip", async () => {
    const { service, signIn } = makeService({ emailAllowed: false });
    await expect(
      service.signInWithEmail({ email: "a@example.com", ip: "1.2.3.4", redirectTo: "/account" }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(signIn.emailCalls).toEqual([]);
  });

  it("delegates to the sign-in gateway on success", async () => {
    const { service, signIn, email } = makeService();
    await service.signInWithEmail({
      email: "a@example.com",
      ip: "1.2.3.4",
      redirectTo: "/account",
    });
    expect(email.keys).toEqual(["1.2.3.4"]);
    expect(signIn.emailCalls).toEqual([{ email: "a@example.com", redirectTo: "/account" }]);
  });
});

describe("AuthService.signInWithOAuth", () => {
  it("throws RateLimitedError when the limiter denies the ip", async () => {
    const { service, signIn } = makeService({ oauthAllowed: false });
    await expect(
      service.signInWithOAuth({ provider: "github", ip: "1.2.3.4", redirectTo: "/account" }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(signIn.oauthCalls).toEqual([]);
  });

  it("delegates to the sign-in gateway on success", async () => {
    const { service, signIn } = makeService();
    await service.signInWithOAuth({ provider: "google", ip: "5.6.7.8", redirectTo: "/account" });
    expect(signIn.oauthCalls).toEqual([{ provider: "google", redirectTo: "/account" }]);
  });
});
