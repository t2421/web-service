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

  // BillingPanel は client component。production build では React 19 の
  // streaming hydration が click より遅れることがあり、Playwright のデフォルト
  // auto-wait は React の hydration を知らないので click 自体が server action を
  // 起動しない。networkidle で all-quiet を待ち、確実に hydration を完了させる。
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "アップグレード" }).first().click();

  // モック checkout は cookie を subscription=active に書き換え、revalidatePath で
  // /billing を再描画する。同時にクライアントが /billing?status=mock-success へ
  // ハードナビゲーションも仕掛けるが両者は race するため URL 末尾の query は不問。
  // ユーザに見える唯一の結果である「アクティブプラン表示」だけ検証する。
  await expect(page.getByText("Pro プランがアクティブです")).toBeVisible({ timeout: 10000 });
});
