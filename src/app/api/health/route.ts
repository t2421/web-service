import { NextResponse } from "next/server";

import { container } from "@/server/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Health endpoint intentionally bypasses the ApiResponse envelope: monitoring
// tools (k8s probes, uptime checks) consume the `checks` map directly even on
// 503, so wrapping it in `{ok: false, error}` would drop signal.
export async function GET() {
  const db = await container().dbHealth.ping();
  const checks = { app: "ok" as const, database: db.ok ? ("ok" as const) : ("fail" as const) };
  return NextResponse.json(
    { status: db.ok ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: db.ok ? 200 : 503 },
  );
}
