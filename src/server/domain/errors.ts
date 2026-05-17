export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", "Unauthorized");
  }
}

export class RateLimitedError extends AppError {
  constructor() {
    super("RATE_LIMITED", "Rate limited");
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super("CONFIG_ERROR", message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`);
  }
}
