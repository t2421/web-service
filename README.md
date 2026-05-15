# Web Service

中規模 SaaS まで耐えうる、Next.js ベースの開発スターター。

[Webサービス開発のデファクトスタンダード](https://t2421.github.io/text-books/web-service-defacto-standard-textbook.html) に沿った構成です。

## 技術スタック

| カテゴリ                | 採用                                          |
| ----------------------- | --------------------------------------------- |
| フレームワーク          | Next.js 15 (App Router, TypeScript)           |
| UI                      | Tailwind CSS + shadcn/ui + Radix UI           |
| 状態管理                | TanStack Query (server) + Zustand (client)    |
| フォーム                | React Hook Form + Zod                         |
| ORM                     | Prisma                                        |
| DB                      | PostgreSQL (本番: Neon / Supabase / RDS)      |
| キャッシュ / レート制限 | Upstash Redis                                 |
| 認証                    | Auth.js v5 (Resend / GitHub / Google)         |
| 決済                    | Stripe (Checkout + Customer Portal + Webhook) |
| メール                  | Resend + React Email                          |
| エラー監視              | Sentry                                        |
| 分析                    | PostHog                                       |
| デプロイ                | Vercel                                        |
| CI                      | GitHub Actions                                |
| テスト                  | Vitest + Testing Library + Playwright         |

## 必要環境

- Node.js 20.11+
- pnpm 9+
- Docker (ローカルDB / Redis)

## セットアップ

```bash
# 1. 依存をインストール
pnpm install

# 2. 環境変数をコピーして編集
cp .env.example .env

# 3. ローカルの Postgres / Redis / MailHog を起動
pnpm docker:up

# 4. DB を初期化
pnpm db:migrate
pnpm db:seed

# 5. 開発サーバー起動
pnpm dev
```

外部サービス（Stripe / Resend / Sentry / PostHog / OAuth）の登録手順は **[docs/SETUP.md](./docs/SETUP.md)** を参照してください。

## ディレクトリ構成

```
src/
├── app/              # Next.js App Router
│   ├── (marketing)/  # 公開ページ
│   ├── (auth)/       # サインインなど
│   ├── (app)/        # 認証必須エリア
│   └── api/          # Route Handlers (auth / stripe webhook / health)
├── components/
│   ├── ui/           # shadcn/ui プリミティブ
│   ├── layout/       # ヘッダーやプロバイダ
│   ├── auth/         # 認証 UI
│   └── billing/      # 課金 UI
├── server/
│   ├── actions/      # Server Actions
│   ├── services/     # ドメインロジック
│   └── repositories/ # データアクセス (Prisma ラップ)
├── lib/              # 横断ユーティリティ (db, auth, stripe, email, redis…)
├── hooks/            # クライアント React hooks
├── emails/           # React Email テンプレート
├── styles/           # Tailwind 補助
└── types/            # TS 型拡張
prisma/               # schema / seed / migrations
tests/
├── unit/             # Vitest
└── e2e/              # Playwright
```

## よく使うコマンド

| コマンド             | 説明                      |
| -------------------- | ------------------------- |
| `pnpm dev`           | Turbopack 開発サーバー    |
| `pnpm build`         | 本番ビルド                |
| `pnpm typecheck`     | 型チェック                |
| `pnpm lint`          | ESLint                    |
| `pnpm format`        | Prettier                  |
| `pnpm test`          | Vitest 単体テスト         |
| `pnpm test:coverage` | カバレッジ計測 (閾値 80%) |
| `pnpm test:e2e`      | Playwright                |
| `pnpm db:studio`     | Prisma Studio             |
| `pnpm db:migrate`    | マイグレーション (dev)    |
| `pnpm db:seed`       | シードデータ投入          |
| `pnpm email:dev`     | React Email プレビュー    |
| `pnpm stripe:listen` | Stripe webhook 転送       |

## デプロイ

- 推奨: Vercel + Neon
- 必要な環境変数は `.env.example` 参照
- 詳細は `docs/SETUP.md` の「デプロイ」セクション

## ライセンス

未定（必要に応じて追加）
