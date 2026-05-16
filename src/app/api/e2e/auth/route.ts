import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  isMockModeEnabled,
  parseMockUser,
  serializeMockUser,
  type MockUser,
} from "@/lib/mock-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function disabled() {
  return NextResponse.json({ error: "Not available" }, { status: 404 });
}

export async function GET() {
  if (!isMockModeEnabled()) return disabled();
  return NextResponse.json({ enabled: true });
}

export async function POST(req: Request) {
  if (!isMockModeEnabled()) return disabled();

  let overrides: Partial<MockUser> = {};
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object") {
      overrides = body as Partial<MockUser>;
    }
  } catch {
    // Empty / non-JSON body — use defaults.
  }

  const user: MockUser = { ...DEFAULT_MOCK_USER, ...overrides };
  const response = NextResponse.json({ user });
  response.cookies.set(MOCK_SESSION_COOKIE, serializeMockUser(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export async function PATCH(req: Request) {
  if (!isMockModeEnabled()) return disabled();

  let patch: Partial<MockUser> = {};
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object") {
      patch = body as Partial<MockUser>;
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const store = await cookies();
  const current = parseMockUser(store.get(MOCK_SESSION_COOKIE)?.value) ?? DEFAULT_MOCK_USER;
  const next: MockUser = { ...current, ...patch };

  const response = NextResponse.json({ user: next });
  response.cookies.set(MOCK_SESSION_COOKIE, serializeMockUser(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export async function DELETE() {
  if (!isMockModeEnabled()) return disabled();
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MOCK_SESSION_COOKIE);
  return response;
}
