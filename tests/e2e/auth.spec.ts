import { test, expect } from "./fixtures";

test("unauthenticated user is redirected from /dashboard to /sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});

test("mock sign-in grants access to /dashboard", async ({ page, signInAsMockUser }) => {
  await signInAsMockUser();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
});

test("custom mock user is reflected in the dashboard greeting", async ({
  page,
  signInAsMockUser,
}) => {
  await signInAsMockUser({ name: "山田太郎", email: "yamada@example.com" });
  await page.goto("/dashboard");
  await expect(page.getByText(/山田太郎/)).toBeVisible();
});

test("signOutMockUser revokes access to protected routes", async ({
  page,
  signInAsMockUser,
  signOutMockUser,
}) => {
  await signInAsMockUser();
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();

  await signOutMockUser();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});
