import { test, expect } from "@playwright/test";

// Browser-side guard: the strict nonce-based CSP must produce zero violations
// across the primary pages. If a script or style is added in the future that
// doesn't pick up the nonce, this fails and points at the regression.
const PAGES = ["/", "/sign-in", "/dashboard", "/billing", "/account"];

for (const path of PAGES) {
  test(`CSP: no violations on ${path}`, async ({ page, request }) => {
    if (path !== "/" && path !== "/sign-in") {
      // Authenticated routes need a mock session.
      await request.post("/api/e2e/auth", { data: {} });
    }
    const violations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" && /Content Security Policy/i.test(text)) {
        violations.push(text);
      }
    });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(violations, violations.join("\n")).toHaveLength(0);
  });
}

test("CSP header is nonce-based, strict, and per-request", async ({ request }) => {
  const r1 = await request.get("/");
  const r2 = await request.get("/");
  const csp1 = r1.headers()["content-security-policy"] ?? "";
  const csp2 = r2.headers()["content-security-policy"] ?? "";

  expect(csp1).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
  expect(csp1).toMatch(/'strict-dynamic'/);
  expect(csp1).not.toMatch(/'unsafe-inline'.*script-src|script-src[^;]*'unsafe-inline'/);
  expect(csp1).not.toMatch(/'unsafe-eval'/);

  const nonce1 = csp1.match(/nonce-([A-Za-z0-9+/=]+)/)?.[1];
  const nonce2 = csp2.match(/nonce-([A-Za-z0-9+/=]+)/)?.[1];
  expect(nonce1).toBeTruthy();
  expect(nonce1).not.toBe(nonce2);
});
