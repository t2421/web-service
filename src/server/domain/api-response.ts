import { NextResponse } from "next/server";

export type ApiError = Readonly<{
  code: string;
  message: string;
}>;

export type ApiResponse<T = unknown> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; error: ApiError }>;

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error: { code, message } }, { status });
}
