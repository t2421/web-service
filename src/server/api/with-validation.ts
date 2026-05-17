import type { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

import { apiError, type ApiResponse } from "@/server/domain/api-response";

type ValidatedHandler<T> = (req: Request, data: T) => Promise<NextResponse<ApiResponse<unknown>>>;

// Parse request JSON and validate it with a Zod schema. On parse/validation
// failure, return a 400 ApiResponse without invoking the handler.
export function withJsonBody<T>(
  schema: ZodSchema<T>,
  handler: ValidatedHandler<T>,
): (req: Request) => Promise<NextResponse<ApiResponse<unknown>>> {
  return async (req) => {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      raw = undefined;
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return apiError("INVALID_BODY", "Request body is invalid", 400);
    }
    return handler(req, parsed.data);
  };
}
