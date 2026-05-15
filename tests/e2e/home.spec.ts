import { expect, test } from "@playwright/test";

test("home page renders hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("dashboard requires auth", async ({ page }) => {
  const response = await page.goto("/dashboard");
  // middleware は /sign-in にリダイレクトする
  await expect(page).toHaveURL(/sign-in/);
  expect(response?.status()).toBeLessThan(500);
});
