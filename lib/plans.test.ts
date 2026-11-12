import { describe, expect, it } from "vitest";
import { PLAN_LIMITS } from "@/lib/plans";

describe("PLAN_LIMITS", () => {
  it("matches the PRD plan numbers", () => {
    expect(PLAN_LIMITS.free).toEqual({ spaces: 3, testimonialsPerSpace: 100 });
    expect(PLAN_LIMITS.pro).toEqual({ spaces: 25, testimonialsPerSpace: 1000 });
  });
});
