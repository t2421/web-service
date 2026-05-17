import { z } from "zod";

import {
  DEFAULT_MOCK_USER,
  MOCK_SESSION_COOKIE,
  isMockModeEnabled,
  serializeMockUser,
  type MockUser,
} from "@/lib/mock-mode";
import { readMockUser } from "@/server/adapters/mock/cookie-helpers";
import { apiError, apiOk } from "@/server/domain/api-response";
import { MOCK_COOKIE_OPTIONS } from "@/server/domain/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notAvailable = () => apiError("NOT_AVAILABLE", "E2E mock mode is not enabled", 404);

const userPatchSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    image: z.string().nullable().optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
    subscription: z.enum(["free", "active"]).optional(),
  })
  .strict();

async function readPatch(req: Request): Promise<Partial<MockUser> | null> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {};
  }
  if (raw === undefined || raw === null) return {};
  const parsed = userPatchSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function respondWithUser(user: MockUser) {
  const response = apiOk({ user });
  response.cookies.set(MOCK_SESSION_COOKIE, serializeMockUser(user), MOCK_COOKIE_OPTIONS);
  return response;
}

export async function GET() {
  if (!isMockModeEnabled()) return notAvailable();
  return apiOk({ enabled: true });
}

export async function POST(req: Request) {
  if (!isMockModeEnabled()) return notAvailable();
  const patch = await readPatch(req);
  if (patch === null) return apiError("INVALID_BODY", "Request body is invalid", 400);
  return respondWithUser({ ...DEFAULT_MOCK_USER, ...patch });
}

export async function PATCH(req: Request) {
  if (!isMockModeEnabled()) return notAvailable();
  const patch = await readPatch(req);
  if (patch === null) return apiError("INVALID_BODY", "Request body is invalid", 400);
  const current = (await readMockUser()) ?? DEFAULT_MOCK_USER;
  return respondWithUser({ ...current, ...patch });
}

export async function DELETE() {
  if (!isMockModeEnabled()) return notAvailable();
  const response = apiOk({ deleted: true });
  response.cookies.delete(MOCK_SESSION_COOKIE);
  return response;
}
