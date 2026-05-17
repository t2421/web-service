export type OAuthProvider = "github" | "google";

export interface SignInGateway {
  // NOTE: Implementations are expected to redirect on success (throw NEXT_REDIRECT).
  withEmail(input: { email: string; redirectTo: string }): Promise<void>;
  withOAuth(input: { provider: OAuthProvider; redirectTo: string }): Promise<void>;
}
