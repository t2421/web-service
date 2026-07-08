# syntax=docker/dockerfile:1
# 本番セルフホスト用イメージ (Vercel を使わない場合)。
#   docker build -t web-service --build-arg NEXT_PUBLIC_APP_URL=https://app.example.com .
#   docker run -p 3000:3000 --env-file .env web-service
# NEXT_PUBLIC_* はビルド時にバンドルへ焼き込まれるため build-arg で渡すこと。
# DB マイグレーションはイメージ起動とは別に `pnpm db:migrate:deploy` を実行する。

FROM node:22-alpine AS base
RUN corepack enable pnpm
ENV HUSKY=0 NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_POSTHOG_KEY=
ARG NEXT_PUBLIC_POSTHOG_HOST=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

# サーバー専用のシークレットはビルド成果物に含めない。
# ビルドを通すためのダミー値のみ設定する (実行時に本物を env で注入)。
ENV NEXT_OUTPUT_MODE=standalone \
    SKIP_ENV_VALIDATION=1 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_SECRET=docker_build_dummy_secret_32_chars_min

# standalone 出力は public/ を含めないため runner で明示コピーする。
# リポジトリに public/ がなくても COPY が失敗しないよう必ず作っておく。
RUN mkdir -p public && pnpm db:generate && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
