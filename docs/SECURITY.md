# Security / Supply Chain

このプロジェクトで実装している **npm サプライチェーン攻撃の予防策** とその運用ルール。

## 攻撃モデル

予防対象として想定する代表的なサプライチェーン攻撃:

| 攻撃                            | 概要                                                          | このリポジトリでの対策                                         |
| ------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| 悪性 postinstall スクリプト     | 依存パッケージの `postinstall` がトークンや `.env` を抜き出す | `pnpm.onlyBuiltDependencies` でスクリプト実行を allowlist 化   |
| 直近公開された悪性バージョン    | 著名パッケージが乗っ取られ、直後に悪性版が publish される     | `.npmrc` の `minimum-release-age=10080`（公開 7 日未満を拒否） |
| Typosquatting                   | `lodahs` などタイポを狙った偽パッケージの混入                 | Dependabot を minor/patch 単位に絞り PR レビュー必須化         |
| Lockfile poisoning              | `package.json` を変えずに `pnpm-lock.yaml` だけで悪性版を固定 | pre-commit / CI で「lock のみ変更」を検出して拒否              |
| Compromised maintainer / hijack | 既存パッケージが乗っ取られ既知バージョンが書き換わる          | `verify-store-integrity` + `--frozen-lockfile`                 |
| Registry confusion              | 内部スコープ名と同名の公開パッケージを優先解決                | `.npmrc` で公開レジストリを単一指定                            |
| 依存の既知脆弱性 (CVE)          | 既知脆弱性が放置されたまま本番に乗る                          | `pnpm audit` を CI と日次 cron で実行                          |
| 悪性 GitHub Action              | サードパーティ Action がトークンを抜く                        | Dependabot で actions を監視（v6 以降タグも追跡）              |

## 実装

### 1. `.npmrc`

- `engine-strict=true`: `engines.node` / `engines.pnpm` 違反のインストールを拒否
- `verify-store-integrity=true`: tarball の SHA-512 を検証
- `prefer-frozen-lockfile=true`: 既定で frozen install
- `registry=https://registry.npmjs.org/`: 公開レジストリ固定
- `audit-level=high`: 監査の閾値
- `minimum-release-age=10080` (= 7 日 = 10,080 分):
  **レジストリ公開から 7 日未満のバージョンは install しない**。
  メンテナアカウント乗っ取り → 悪性版 publish 直後の取り込みを物理的に防ぐ。
  例外があれば `minimum-release-age-exclude` にスコープを列挙（例: `@my-org/*`）。
  この機能は **pnpm v10.16+** が必要なので、`packageManager` / `engines.pnpm` も合わせて更新済み。

### 2. `package.json` の `pnpm` フィールド

- `onlyBuiltDependencies`: **install スクリプトを実行できるパッケージの allowlist**。
  ここに無いパッケージの `preinstall` / `install` / `postinstall` は pnpm が黙って無視する。

新しい依存を追加して install が失敗した場合は、本当に build スクリプトが必要なパッケージかを精査し、
必要なら `onlyBuiltDependencies` に追記する。**追記するときは PR に理由を明記すること。**

### 3. CI (`.github/workflows/security.yml`)

| ジョブ               | トリガ                     | 内容                                                         |
| -------------------- | -------------------------- | ------------------------------------------------------------ |
| `audit`              | push / PR / 毎日 06:00 UTC | `pnpm audit --prod --audit-level=high` で本番依存をブロック  |
| `dependency-review`  | PR                         | GitHub 純正 Action で追加依存をシビアリティ / ライセンス検証 |
| `lockfile-integrity` | push / PR                  | `--frozen-lockfile --ignore-scripts` で lock の完全性を検査  |
| `scorecard`          | push / 日次                | OpenSSF Scorecard でリポジトリ自体の運用品質を点検           |

`audit` ジョブは **`--ignore-scripts` で install** することで、監査時に悪性スクリプトが副作用を起こさないようにしている。

### 4. pre-commit (`.husky/pre-commit` + `scripts/check-lockfile.mjs`)

`pnpm-lock.yaml` だけが変更されたコミットを拒否する（lockfile poisoning の典型パターン）。
意図的なロック再生成は `SKIP_LOCKFILE_GUARD=1 git commit ...` でバイパス可能。

### 5. Dependabot (`.github/dependabot.yml`)

- メジャー更新は ignore → 必ず手動 PR にすることで一括取り込みを防ぐ
- production の patch / dev の minor+patch は自動グループ化
- 全 PR に `security-review-needed` ラベルを付与

## 新規依存を追加するときのチェックリスト

1. パッケージのメンテナと最終 publish 日時を確認（過度に新しい /放置気味は警戒）
2. `npm view <pkg> repository` で出所リポジトリを確認
3. `pnpm view <pkg> dist.tarball` で tarball を直接確認可能
4. install スクリプトが必要な場合は **理由を PR に書く**
5. Dependency Review が PR で fail していないか確認

## インシデント時の手順（依存パッケージの侵害が公表されたとき）

1. `pnpm why <package>` で影響範囲を特定
2. 該当バージョンを `pnpm.overrides` で安全版へ固定
   ```jsonc
   "pnpm": {
     "overrides": {
       "vulnerable-pkg@<2.0.5": ">=2.0.6"
     }
   }
   ```
3. `pnpm install --frozen-lockfile=false --ignore-scripts` で再解決
4. 影響範囲のテスト + 監査ログ確認
5. 必要なら `AUTH_SECRET` などのクレデンシャルをローテーション
