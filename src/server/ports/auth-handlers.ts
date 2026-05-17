import type { NextRequest } from "next/server";

// HTTP handlers mounted at /api/auth/[...x]. NextRequest is what the Next.js
// runtime hands to route handlers, so we expose that to give adapters the full
// API surface (cookies, nextUrl, etc.).
export interface AuthHandlers {
  GET: (req: NextRequest) => Promise<Response>;
  POST: (req: NextRequest) => Promise<Response>;
}
