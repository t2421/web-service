import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_PRO_YEARLY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),
  // Frontend E2E mock mode. Set to "1" to stub auth/Stripe for Playwright.
  // MUST NOT be set in real production environments.
  E2E_MOCK_MODE: z.enum(["0", "1"]).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

// .env では未設定の変数を KEY= (空文字) で書くことが多い。
// z.string().url().optional() は undefined は通すが "" は reject するため、空文字を undefined に正規化する。
const e = (v: string | undefined) => v || undefined;

const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: e(process.env.DIRECT_URL),
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: e(process.env.AUTH_URL),
  AUTH_GOOGLE_ID: e(process.env.AUTH_GOOGLE_ID),
  AUTH_GOOGLE_SECRET: e(process.env.AUTH_GOOGLE_SECRET),
  AUTH_GITHUB_ID: e(process.env.AUTH_GITHUB_ID),
  AUTH_GITHUB_SECRET: e(process.env.AUTH_GITHUB_SECRET),
  STRIPE_SECRET_KEY: e(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: e(process.env.STRIPE_WEBHOOK_SECRET),
  STRIPE_PRICE_ID_PRO_MONTHLY: e(process.env.STRIPE_PRICE_ID_PRO_MONTHLY),
  STRIPE_PRICE_ID_PRO_YEARLY: e(process.env.STRIPE_PRICE_ID_PRO_YEARLY),
  RESEND_API_KEY: e(process.env.RESEND_API_KEY),
  EMAIL_FROM: e(process.env.EMAIL_FROM),
  UPSTASH_REDIS_REST_URL: e(process.env.UPSTASH_REDIS_REST_URL),
  UPSTASH_REDIS_REST_TOKEN: e(process.env.UPSTASH_REDIS_REST_TOKEN),
  SENTRY_ORG: e(process.env.SENTRY_ORG),
  SENTRY_PROJECT: e(process.env.SENTRY_PROJECT),
  SENTRY_AUTH_TOKEN: e(process.env.SENTRY_AUTH_TOKEN),
  POSTHOG_PERSONAL_API_KEY: e(process.env.POSTHOG_PERSONAL_API_KEY),
  E2E_MOCK_MODE: e(process.env.E2E_MOCK_MODE) as "0" | "1" | undefined,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: e(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  NEXT_PUBLIC_SENTRY_DSN: e(process.env.NEXT_PUBLIC_SENTRY_DSN),
  NEXT_PUBLIC_POSTHOG_KEY: e(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  NEXT_PUBLIC_POSTHOG_HOST: e(process.env.NEXT_PUBLIC_POSTHOG_HOST),
};

const isServer = typeof window === "undefined";

// Skip strict validation during `next build`'s page-data collection. Build runners
// (Vercel preview, CI without secrets) don't always have runtime credentials, but
// they only need to compile and inspect route shapes — they never serve requests.
// The first real request triggers validation in the serverless function's cold
// start, which still gives us fail-fast behavior in production.
// Explicit `SKIP_ENV_VALIDATION=1` is also honoured for forced opt-out.
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" || process.env.NEXT_PHASE === "phase-production-build";

const parsed = skipValidation
  ? { success: true as const, data: processEnv }
  : isServer
    ? serverSchema.merge(clientSchema).safeParse(processEnv)
    : clientSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check .env.example for required keys.");
}

export const env = parsed.data as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
