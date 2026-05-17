import { test, expect } from "./fixtures";

test("free user sees the upgrade plans", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ subscription: "free" });
  await page.goto("/billing");
  await expect(page.getByText("Pro 月額")).toBeVisible();
  await expect(page.getByText("Pro 年額")).toBeVisible();
});

test("active subscriber sees the current plan", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ subscription: "active" });
  await page.goto("/billing");
  await expect(page.getByText("Pro プランがアクティブです")).toBeVisible();
});

test("clicking upgrade activates the plan in mock mode", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser({ subscription: "free" });
  await page.goto("/billing");
  await expect(page.getByText("Pro 月額")).toBeVisible();

  await page.getByRole("button", { name: "アップグレード" }).first().click();

  // モック checkout は cookie を subscription=active に書き換え、revalidatePath で
  // 現ルートを再描画する。同時にクライアント側で /billing?status=mock-success への
  // ハードナビゲーションも走るが、両者は race するため URL 末尾の query には依存しない。
  // ユーザに見える唯一の結果である「アクティブプラン表示」だけ検証する。
  await expect(page.getByText("Pro プランがアクティブです")).toBeVisible({ timeout: 10000 });
});
