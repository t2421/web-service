/* eslint-disable react-hooks/rules-of-hooks -- Playwright's fixture `use` callback is not a React hook. */
import { test as base, expect, type Page } from "@playwright/test";

export type MockUserOverrides = {
  id?: string;
  name?: string;
  email?: string;
  role?: "USER" | "ADMIN";
  subscription?: "free" | "active";
};

async function signInAsMockUser(page: Page, overrides: MockUserOverrides = {}) {
  const res = await page.request.post("/api/e2e/auth", { data: overrides });
  if (!res.ok()) {
    throw new Error(
      `Mock sign-in failed (${res.status()}). ` +
        `Ensure the dev server is running with E2E_MOCK_MODE=1 (e.g. \`pnpm dev:e2e\`).`,
    );
  }
}

async function signOutMockUser(page: Page) {
  await page.request.delete("/api/e2e/auth");
}

type Fixtures = {
  signInAsMockUser: (overrides?: MockUserOverrides) => Promise<void>;
  signOutMockUser: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  signInAsMockUser: async ({ page }, use) => {
    await use((overrides) => signInAsMockUser(page, overrides));
  },
  signOutMockUser: async ({ page }, use) => {
    await use(() => signOutMockUser(page));
  },
});

export { expect };
