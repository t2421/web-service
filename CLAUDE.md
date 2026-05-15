# Claude Code 向けプロジェクトメモ

## このリポジトリは何

中規模 SaaS まで耐えうる Web サービスのスターター。
[Webサービス開発のデファクトスタンダード](https://t2421.github.io/text-books/web-service-defacto-standard-textbook.html) を踏襲。

## 重要な前提

- パッケージマネージャ: **pnpm**
- フレームワーク: **Next.js 15 (App Router)**
- 言語: **TypeScript strict + noUncheckedIndexedAccess**
- ORM: **Prisma**
- 認証: **Auth.js v5 (database session)**
- 決済: **Stripe**
- メール: **Resend + React Email**
- 監視: **Sentry**
- 分析: **PostHog**

## 設計原則

- 不変オブジェクト優先（mutate しない）
- ファイルは小さく（< 400 行、最大 800 行）
- ビジネスロジックは `src/server/services/` に集約
- DB アクセスは `src/server/repositories/` 経由が原則
- 入力は **Zod** で境界検証

## よく使うコマンド

```bash
pnpm dev              # 開発サーバー
pnpm typecheck        # 型チェック
pnpm lint             # ESLint
pnpm test             # Vitest
pnpm test:e2e         # Playwright
pnpm db:migrate       # マイグレーション
pnpm db:studio        # Prisma Studio
pnpm stripe:listen    # Stripe webhook 転送
```

## 拡張時の指針

- 新しいテーブルを足す: `prisma/schema.prisma` → `pnpm db:migrate`
- 新しい Server Action: `src/server/actions/<feature>.ts` に追加し、Zod で入力検証
- 新しい外部 API ラッパー: `src/lib/<service>.ts` に server-only で配置
- 新しい UI: shadcn/ui の `pnpm dlx shadcn@latest add <component>` を優先

## 外部サービス連携

未設定の外部サービス（Stripe / Resend / Sentry / PostHog / OAuth）は
`docs/SETUP.md` を見て鍵を取得し `.env` に投入してから機能が有効化される。
コード側は全て **環境変数がなければスキップする** 構造になっている。
