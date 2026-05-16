import type { NextRequest, NextResponse } from "next/server";

// Edge-safe middleware: takes a request, returns a redirect/short-circuit response
// or undefined to continue. Must NOT import Node-only modules (Prisma, Resend, fs ...).
export type AuthMiddleware = (
  request: NextRequest,
) => Promise<NextResponse | undefined> | NextResponse | undefined;
