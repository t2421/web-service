# SETUP — 外部サービス手動セットアップ手順

この雛形を動かすために、ユーザー側で取得・設定が必要な情報の一覧です。
すべて完了すれば、`.env` を埋めて `pnpm dev` で立ち上がります。

> ⚠️ コードは取得後に設定するだけで動作するよう構成済みです。
> 取得した値を `.env`（ローカル）と Vercel の Environment Variables（本番）に入れてください。

---

## 0. ローカル前提

- [ ] **Node.js 20.11+** をインストール（`nvm install`）
- [ ] **pnpm 9+** をインストール（`corepack enable && corepack prepare pnpm@9 --activate`）
- [ ] **Docker Desktop** をインストール

---

## 1. データベース (PostgreSQL)

### ローカル
- [ ] `pnpm docker:up` で `postgres:16` が起動します。`.env` の `DATABASE_URL` は既定値のままで動作します。

### 本番 — Neon を推奨
- [ ] https://neon.tech にサインアップ
- [ ] プロジェクト作成 → リージョン: `Tokyo (ap-northeast-1)` 推奨
- [ ] **Connection string (pooled)** を取得 → `DATABASE_URL` に設定
- [ ] **Direct connection string** を取得 → `DIRECT_URL` に設定（Prisma migrate 用）
- [ ] 本番デプロイ前に `pnpm db:migrate:deploy` を実行

> Supabase でも可（同じく Postgres）。その場合は Storage / Auth / Realtime も利用検討。

---

## 2. Redis (Upstash) — 任意

レート制限・キャッシュ用。なくても動作するが、本番では必須レベル。

- [ ] https://upstash.com にサインアップ
- [ ] **Redis** データベース作成 → リージョン: `ap-northeast-1`
- [ ] REST API の **URL** と **Token** を取得
- [ ] `.env` に設定:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

---

## 3. 認証 (Auth.js)

### 必須
- [ ] シークレットを生成して `AUTH_SECRET` に設定:
  ```bash
  openssl rand -base64 32
  ```

### Magic Link (Resend) ← デフォルトの推奨
- 「4. メール (Resend)」を完了すれば自動で有効化されます。

### Google OAuth — 任意
- [ ] https://console.cloud.google.com/ で新規プロジェクト作成
- [ ] **OAuth consent screen** を構成（外部, スコープは email/profile）
- [ ] **Credentials → Create OAuth client → Web application**
- [ ] 承認済みリダイレクト URI:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://<本番ドメイン>/api/auth/callback/google`
- [ ] `.env` に設定:
  - `AUTH_GOOGLE_ID`
  - `AUTH_GOOGLE_SECRET`

### GitHub OAuth — 任意
- [ ] https://github.com/settings/developers → **New OAuth App**
- [ ] Homepage URL: `https://<本番ドメイン>`（ローカル開発は `http://localhost:3000`）
- [ ] Authorization callback URL:
  - `http://localhost:3000/api/auth/callback/github`
  - `https://<本番ドメイン>/api/auth/callback/github`
- [ ] `.env` に設定:
  - `AUTH_GITHUB_ID`
  - `AUTH_GITHUB_SECRET`

---

## 4. メール (Resend)

- [ ] https://resend.com にサインアップ
- [ ] **API Keys → Create API Key** → `RESEND_API_KEY` に設定
- [ ] **Domains** に送信元ドメインを追加 → DNS の TXT/MX レコードを設定
- [ ] `.env` の `EMAIL_FROM` を `"App <noreply@yourdomain.com>"` に変更

> 開発時は MailHog (http://localhost:8025) で受信確認できます。`pnpm email:dev` でテンプレートのプレビューも可。

---

## 5. 決済 (Stripe)

### Stripe ダッシュボード
- [ ] https://dashboard.stripe.com にサインアップ
- [ ] **テストモード**で進める
- [ ] **Developers → API keys**:
  - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - **Secret key** → `STRIPE_SECRET_KEY`

### 商品と価格
- [ ] **Products → Add product**: Pro プラン作成
  - 月額用と年額用の 2 価格を作成
- [ ] 各 Price の `price_xxx` を取得し、`.env` に設定:
  - `STRIPE_PRICE_ID_PRO_MONTHLY`
  - `STRIPE_PRICE_ID_PRO_YEARLY`

### Webhook
- [ ] **ローカル開発**: Stripe CLI をインストールし、別ターミナルで
  ```bash
  stripe login
  pnpm stripe:listen
  ```
  出力された `whsec_xxx` を `STRIPE_WEBHOOK_SECRET` に設定
- [ ] **本番**: Dashboard → **Developers → Webhooks → Add endpoint**
  - URL: `https://<本番ドメイン>/api/stripe/webhook`
  - 監視イベント:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_failed`
  - 取得した署名シークレットを Vercel の `STRIPE_WEBHOOK_SECRET` に設定

### Customer Portal
- [ ] Dashboard → **Settings → Billing → Customer portal** を有効化
- [ ] 解約・プラン変更などの許可項目を設定

---

## 6. エラー監視 (Sentry) — 任意

- [ ] https://sentry.io にサインアップ
- [ ] 新規プロジェクト作成: **Platform: Next.js**
- [ ] **DSN** を取得 → `NEXT_PUBLIC_SENTRY_DSN`
- [ ] **Settings → Auth Tokens** で内部用トークン作成 → `SENTRY_AUTH_TOKEN`
- [ ] 組織スラッグ → `SENTRY_ORG`、プロジェクトスラッグ → `SENTRY_PROJECT`
- [ ] Vercel デプロイ時、これらが設定されていればソースマップ自動アップロード

---

## 7. プロダクト分析 (PostHog) — 任意

- [ ] https://posthog.com にサインアップ
- [ ] プロジェクト作成 → **Project API Key** を取得 → `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] リージョンに応じて `NEXT_PUBLIC_POSTHOG_HOST`:
  - US: `https://us.i.posthog.com`
  - EU: `https://eu.i.posthog.com`
- [ ] サーバー送信用に **Personal API Key** を発行 → `POSTHOG_PERSONAL_API_KEY`（任意）

---

## 8. デプロイ (Vercel)

- [ ] https://vercel.com にサインアップ → GitHub と連携
- [ ] このリポジトリをインポート
- [ ] **Build Command**: `pnpm build` (自動検出)
- [ ] **Install Command**: `pnpm install --frozen-lockfile`
- [ ] Environment Variables にこのドキュメントで取得したすべての値を投入
  - Production / Preview / Development を分けて設定可能
- [ ] **Domain** を割り当て → `NEXT_PUBLIC_APP_URL` を本番ドメインに更新
- [ ] デプロイ後、Stripe Webhook と OAuth Provider のリダイレクト URI を本番ドメインに追加

### Vercel 環境変数の最小セット (本番)

```
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=https://<本番ドメイン>
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_PRO_MONTHLY=
STRIPE_PRICE_ID_PRO_YEARLY=
RESEND_API_KEY=
EMAIL_FROM=
# 任意
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## 9. GitHub リポジトリ設定

- [ ] **Settings → Branches → Branch protection rules** で `main` を保護
  - PR レビュー必須
  - status check: `lint`, `test`, `build` を必須に
- [ ] **Settings → Code security and analysis** で Dependabot / CodeQL を有効化
- [ ] **Secrets and variables → Actions** に必要な値を登録（本番デプロイを GH Actions から行う場合）

---

## 10. 動作確認チェックリスト

ローカルで `pnpm dev` 後に以下を確認:

- [ ] http://localhost:3000 にアクセスしてランディングが表示される
- [ ] `/sign-in` でメール / OAuth サインインが動作
- [ ] サインイン後 `/dashboard` にリダイレクト
- [ ] `/billing` でチェックアウトに遷移し、テストカード `4242 4242 4242 4242` で決済成功
- [ ] Stripe CLI が webhook を転送し、DB に `Subscription` が作成される
- [ ] `/api/health` が 200 を返す

---

## 必要情報まとめ (この一覧をユーザーが埋める)

| キー | 取得元 | 必須/任意 | 値 |
|--|--|--|--|
| `DATABASE_URL` | Neon / Supabase | 必須 | |
| `DIRECT_URL` | Neon / Supabase | 必須 | |
| `AUTH_SECRET` | `openssl rand -base64 32` | 必須 | |
| `AUTH_GOOGLE_ID` / `SECRET` | Google Cloud | 任意 | |
| `AUTH_GITHUB_ID` / `SECRET` | GitHub OAuth Apps | 任意 | |
| `RESEND_API_KEY` | Resend | 推奨 | |
| `EMAIL_FROM` | 自前ドメイン | 推奨 | |
| `STRIPE_SECRET_KEY` | Stripe | 課金時必須 | |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook | 課金時必須 | |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | 課金時必須 | |
| `STRIPE_PRICE_ID_PRO_MONTHLY` | Stripe Product | 課金時必須 | |
| `STRIPE_PRICE_ID_PRO_YEARLY` | Stripe Product | 課金時必須 | |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Upstash | 任意 | |
| `NEXT_PUBLIC_SENTRY_DSN` ほか | Sentry | 任意 | |
| `NEXT_PUBLIC_POSTHOG_KEY` ほか | PostHog | 任意 | |
| Vercel デプロイ | Vercel | 本番時必須 | |
