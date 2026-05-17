export type ActionError = Readonly<{
  code: string;
  message: string;
}>;

export type ActionResult<T = void> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{ success: false; error: ActionError }>;

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | void> {
  return { success: true, data: data as T };
}

export function fail(code: string, message: string): ActionResult<never> {
  return { success: false, error: { code, message } };
}
