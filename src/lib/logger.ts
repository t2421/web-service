type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function format(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  return JSON.stringify(payload);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.info(format("debug", message, context));
    }
  },
  info(message: string, context?: LogContext) {
    console.info(format("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(format("warn", message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(format("error", message, context));
  },
};
