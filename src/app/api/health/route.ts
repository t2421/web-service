import { NextResponse } from "next/server";

import { container } from "@/server/container";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await container().dbHealth.ping();
  const checks = { app: "ok" as const, database: db.ok ? ("ok" as const) : ("fail" as const) };
  const allOk = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
