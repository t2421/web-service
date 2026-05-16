import { test, expect } from "./fixtures";

test("account page shows the mock user's profile", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ name: "テスト ユーザー", email: "test@example.com" });
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "マイページ" })).toBeVisible();
  await expect(page.getByLabel("表示名")).toHaveValue("テスト ユーザー");
  await expect(page.getByLabel("メールアドレス")).toHaveValue("test@example.com");
});
