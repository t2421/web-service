import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "fail"> = { app: "ok" };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "fail";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
