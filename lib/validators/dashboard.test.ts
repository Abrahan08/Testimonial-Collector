import { describe, expect, it } from "vitest";
import { dashboardQuerySchema } from "@/lib/validators/dashboard";

describe("dashboardQuerySchema", () => {
  it("uses defaults when empty", () => {
    expect(dashboardQuerySchema.parse({})).toEqual({ space: undefined, range: 30, granularity: "day" });
  });
  it("accepts valid values", () => {
    expect(dashboardQuerySchema.parse({ space: "abc", range: "90", granularity: "month" })).toEqual({
      space: "abc",
      range: 90,
      granularity: "month",
    });
  });
  it("falls back on bad values", () => {
    const q = dashboardQuerySchema.parse({ space: "x".repeat(200), range: "999", granularity: "year" });
    expect(q).toEqual({ space: undefined, range: 30, granularity: "day" });
    expect(dashboardQuerySchema.parse({ range: "abc" }).range).toBe(30);
    expect(dashboardQuerySchema.parse({ range: "" }).range).toBe(30);
  });
});
