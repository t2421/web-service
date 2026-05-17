export type UserRole = "USER" | "ADMIN";

export type AuthUser = Readonly<{
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
}>;

export type AuthSession = Readonly<{
  user: AuthUser;
  expiresAt: Date;
}>;

type RawSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

// Build an AuthSession from any upstream session shape (NextAuth, mock cookie,
// ...). The role defaults to "USER" and missing fields are normalised to null.
export function toAuthSession(input: { user: RawSessionUser; expiresAt: Date }): AuthSession {
  return {
    user: {
      id: input.user.id,
      name: input.user.name ?? null,
      email: input.user.email ?? null,
      image: input.user.image ?? null,
      role: (input.user.role as UserRole | null | undefined) ?? "USER",
    },
    expiresAt: input.expiresAt,
  };
}
