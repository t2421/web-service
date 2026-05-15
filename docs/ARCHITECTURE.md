# Architecture

## 設計指針

- **設定より規約**: 選択肢を絞り、迷い時間を最小化する。
- **垂直スライス**: 認証→課金→ダッシュボードをまず一気通貫で動かす。
- **横展開しやすいレイヤ**: server actions → services → repositories の3層。
- **境界での検証**: すべての入力は Zod で検証してから内側に渡す。
- **不変データ**: 状態は新しいオブジェクトを返して反映する。

## レイヤ責務

| レイヤ | ディレクトリ | 役割 |
|--|--|--|
| Presentation | `src/app/**`, `src/components/**` | UI / Router / RSC |
| Application | `src/server/actions/**` | Server Actions / 入力検証 / 認可 |
| Domain | `src/server/services/**` | ビジネスロジック |
| Infrastructure | `src/server/repositories/**`, `src/lib/**` | Prisma / Stripe / Resend など外部依存 |

## ランタイム

- ほとんどの Route と Server Actions は **Node.js runtime** を想定。
- Edge にするのは画像最適化や軽量な middleware のみ。
- Stripe webhook は raw body が必要なので `runtime = "nodejs"` を明示。

## セッション

- Auth.js v5、`session.strategy = "database"`。
- Prisma adapter で `User`/`Session`/`Account`/`VerificationToken` を管理。
- 拡張プロパティ (`role`, `id`) は `src/types/next-auth.d.ts` で型を広げている。

## 課金フロー

```
ユーザー
  └─ /billing で "アップグレード"
       └─ Server Action: createCheckoutSession
            └─ Stripe Checkout に遷移
                 └─ 支払い完了
                      └─ Stripe → /api/stripe/webhook
                           └─ Subscription を upsert
```

## ロギング / 観測

- すべての Server Action / Route Handler は失敗時にコンソール JSON で記録 (`logger.error`)。
- 本番では Sentry がスタックトレースを収集。
- `Vercel Analytics` (任意) と PostHog で UX イベントを分離。

## マイグレーション戦略

- 開発時: `pnpm db:migrate`
- 本番: `pnpm db:migrate:deploy` を CI またはリリースジョブで実行。
- 破壊的変更は2段階デプロイ（add → backfill → switch → drop）を原則とする。

## スケーリングの考え方

| 規模 | 構成 |
|--|--|
| ~10 RPS | Vercel + Neon Free + Resend + Stripe |
| ~100 RPS | Vercel Pro + Neon Pro + Upstash + Sentry |
| 100+ RPS | DB の read replica、CDN キャッシュ、ジョブキュー (Inngest/Trigger.dev) |

## 今後足す候補

- バックグラウンドジョブ: Inngest / Trigger.dev
- 全文検索: Postgres pg_trgm → Typesense / Meilisearch
- フィーチャーフラグ: PostHog Feature Flags
- リアルタイム: Pusher / Ably / Supabase Realtime
- 国際化: next-intl
- 管理画面: `/admin` ルートを role=ADMIN ガードで追加
