import { headers } from "next/headers";

// X-Forwarded-For may chain multiple IPs ("client, proxy1, proxy2"); the
// left-most entry is the original client. Falls back to loopback so rate-limit
// keys remain stable in local/dev without a proxy.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}
