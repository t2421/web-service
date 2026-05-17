import type { NextResponse } from "next/server";

import { AppError } from "@/server/domain/errors";
import { apiError, type ApiResponse } from "@/server/domain/api-response";

type RouteHandler<Args extends unknown[]> = (
  ...args: Args
) => Promise<NextResponse<ApiResponse<unknown>>>;

// Wraps a Route Handler so AppError (and unknown errors) become a uniform
// ApiResponse envelope. AppError preserves its `code` and HTTP status (500 by
// default); pass an explicit status by throwing through a typed subclass.
export function withApiErrorHandler<Args extends unknown[]>(
  handler: RouteHandler<Args>,
  defaultStatus = 500,
): RouteHandler<Args> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return apiError(error.code, error.message, defaultStatus);
      }
      console.error("[api-handler]", error);
      return apiError("SERVER_ERROR", "Server error", 500);
    }
  };
}
