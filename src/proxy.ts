import { edgeContainer } from "@/server/edge-container";

// The Edge container picks the right auth-provider middleware. To switch from
// NextAuth to Clerk / Lucia / anything else: change edge-container.ts. This file
// stays as is.
export default edgeContainer.middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
