import { describe, expect, it } from "vitest";

import { absoluteUrl, cn, formatCurrency, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and dedups conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});

describe("formatCurrency", () => {
  it("formats JPY by default", () => {
    expect(formatCurrency(1000)).toMatch(/￥|¥/);
  });
});

describe("formatDate", () => {
  it("formats date in ja-JP", () => {
    expect(formatDate("2026-01-15")).toContain("2026");
  });
});

describe("absoluteUrl", () => {
  it("returns base + path", () => {
    expect(absoluteUrl("/foo")).toMatch(/\/foo$/);
    expect(absoluteUrl("bar")).toMatch(/\/bar$/);
  });
});
