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
  await page.getByRole("button", { name: "アップグレード" }).first().click();
  await expect(page).toHaveURL(/status=mock-success/);
  await expect(page.getByText("Pro プランがアクティブです")).toBeVisible();
});
