export interface DbHealthCheck {
  ping(): Promise<{ ok: boolean }>;
}
