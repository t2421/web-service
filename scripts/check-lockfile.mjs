#!/usr/bin/env node
// pnpm-lock.yaml の不審な変更を pre-commit で早期検出する。
// "lockfile poisoning"（package.json を変えずに依存ツリーへ悪性パッケージを差し込む攻撃）対策。
//
// ルール:
//   - pnpm-lock.yaml だけがステージされ、package.json が無関係なら commit を中断する
//   - 緊急回避: SKIP_LOCKFILE_GUARD=1 git commit ...
//
// 完全な整合性検証（--frozen-lockfile install）は CI 側（security.yml）で行う。

import { execSync } from "node:child_process";

const staged = execSync("git diff --cached --name-only", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const lockChanged = staged.includes("pnpm-lock.yaml");
const pkgChanged = staged.includes("package.json");

if (lockChanged && !pkgChanged && process.env.SKIP_LOCKFILE_GUARD !== "1") {
  console.error(
    "\n[supply-chain-guard] pnpm-lock.yaml だけが変更されています。\n" +
      "  package.json を変えずに lockfile を書き換えるのは lockfile poisoning の典型パターンです。\n" +
      "  意図的なロック再生成であれば、コミット理由を明記し以下で再実行してください:\n" +
      "    SKIP_LOCKFILE_GUARD=1 git commit ...\n",
  );
  process.exit(1);
}
