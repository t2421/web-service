import { NextResponse } from "next/server";

import { MOCK_SESSION_COOKIE } from "@/lib/mock-mode";
import type { AuthHandlers } from "@/server/ports/auth-handlers";

// Mock /api/auth/* endpoints used by client code (next-auth/react's signOut / csrf).
// We intercept the two routes the client actually hits and let the mock cookie drive
// session lifecycle. Other auth endpoints aren't needed in mock mode.
function isPath(req: Request, suffix: string): boolean {
  return new URL(req.url).pathname.endsWith(suffix);
}

export function makeMockAuthHandlers(): AuthHandlers {
  return {
    async GET(req) {
      if (isPath(req, "/auth/csrf")) {
        return NextResponse.json({ csrfToken: "mock-csrf-token" });
      }
      if (isPath(req, "/auth/session")) {
        return NextResponse.json({});
      }
      return new NextResponse(null, { status: 404 });
    },
    async POST(req) {
      if (isPath(req, "/auth/signout")) {
        const url = new URL(req.url);
        const response = NextResponse.json({ url: `${url.origin}/` });
        response.cookies.delete(MOCK_SESSION_COOKIE);
        return response;
      }
      return new NextResponse(null, { status: 404 });
    },
  };
}
