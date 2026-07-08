import { test, expect } from "./fixtures";

test("account page shows the mock user's profile", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ name: "テスト ユーザー", email: "test@example.com" });
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "マイページ" })).toBeVisible();
  await expect(page.getByLabel("表示名")).toHaveValue("テスト ユーザー");
  await expect(page.getByLabel("メールアドレス")).toHaveValue("test@example.com");
});

test("updating the display name persists across reloads", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ name: "旧 名前", email: "test@example.com" });
  await page.goto("/account");
  // client component の hydration 完了を待つ (billing.spec.ts と同じ理由)。
  await page.waitForLoadState("networkidle");

  await page.getByLabel("表示名").fill("新しい 名前");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("プロフィールを更新しました。")).toBeVisible();

  // モックモードではセッション cookie に書き戻されるため、リロード後も反映される。
  await page.reload();
  await expect(page.getByLabel("表示名")).toHaveValue("新しい 名前");
});

test("deleting the account signs the user out", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ name: "削除 対象", email: "delete-me@example.com" });
  await page.goto("/account");
  await page.waitForLoadState("networkidle");

  // 二段階確認: 「アカウントを削除」→「完全に削除する」
  await page.getByRole("button", { name: "アカウントを削除" }).click();
  await page.getByRole("button", { name: "完全に削除する" }).click();

  // 削除後はサインアウトされトップへ戻る。保護ページはサインインへリダイレクトされる。
  await page.waitForURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL(/sign-in/);
});
