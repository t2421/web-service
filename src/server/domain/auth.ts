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
