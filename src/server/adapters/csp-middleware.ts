import { NextResponse } from "next/server";

import { buildCsp, generateCspNonce } from "@/server/csp";
import type { AuthMiddleware } from "@/server/ports/auth-middleware";

// Wrap an AuthMiddleware so every matched request gets a per-request CSP nonce
// and a strict CSP header. The nonce is injected into `x-nonce` on the request
// headers; Next.js's renderer detects it and stamps inline RSC / chunk scripts
// with the matching nonce, satisfying `script-src 'nonce-…'`.
//
// We don't pre-call the inner middleware with the modified request because
// NextAuth's middleware reads the original request (cookies / nextUrl) and the
// rewritten headers only need to reach the page-render layer, not the auth
// check itself.
export function withCsp(inner: AuthMiddleware): AuthMiddleware {
  return async (request) => {
    const nonce = generateCspNonce();
    const csp = buildCsp(nonce);

    const innerResponse = await inner(request);

    // Redirect or other short-circuit: keep the inner response, stamp CSP.
    if (innerResponse && innerResponse.status >= 300 && innerResponse.status < 400) {
      innerResponse.headers.set("Content-Security-Policy", csp);
      innerResponse.headers.set("x-nonce", nonce);
      return innerResponse;
    }

    // Continue: emit our own NextResponse.next that forwards x-nonce into the
    // request handed off to the page render, and carries CSP on the response.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);

    const next = NextResponse.next({ request: { headers: requestHeaders } });
    next.headers.set("Content-Security-Policy", csp);
    next.headers.set("x-nonce", nonce);
    return next;
  };
}
