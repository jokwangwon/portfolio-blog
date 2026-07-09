import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("formatDate", () => {
  it("should format date in Korean locale", () => {
    const result = formatDate("2026-03-31T10:30:00");
    expect(result).toContain("2026");
    expect(result).toContain("3");
    expect(result).toContain("31");
  });
});

describe("formatDateTime", () => {
  it("should format date and time in Korean locale", () => {
    const result = formatDateTime("2026-03-31T10:30:00");
    expect(result).toContain("2026");
    expect(result).toContain("3");
    expect(result).toContain("31");
    expect(result).toContain("10");
    expect(result).toContain("30");
  });
});
