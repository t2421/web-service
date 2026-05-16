import type { AuthSession } from "@/server/domain/auth";

export interface SessionGateway {
  getSession(): Promise<AuthSession | null>;
}
