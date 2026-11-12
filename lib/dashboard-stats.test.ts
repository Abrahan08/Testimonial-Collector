import { describe, expect, it } from "vitest";
import { bucketStart, fillBuckets, planUsage, rangeStart } from "@/lib/dashboard-stats";

const now = new Date("2026-11-12T15:30:00Z"); // Thursday

describe("rangeStart", () => {
  it("is UTC midnight, range days inclusive of today", () => {
    expect(rangeStart(now, 7).toISOString()).toBe("2026-11-06T00:00:00.000Z");
  });
});

describe("bucketStart", () => {
  it("snaps weeks to Monday and months to the 1st", () => {
    expect(bucketStart(now, "week").toISOString()).toBe("2026-11-09T00:00:00.000Z");
    expect(bucketStart(new Date("2026-11-15T10:00:00Z"), "week").toISOString()).toBe("2026-11-09T00:00:00.000Z");
    expect(bucketStart(now, "month").toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("fillBuckets", () => {
  it("returns zeros for empty rows, one per day", () => {
    const out = fillBuckets({ rows: [], range: 7, granularity: "day", now });
    expect(out).toHaveLength(7);
    expect(out.every((p) => p.count === 0)).toBe(true);
    expect(out[0].date).toBe("2026-11-06T00:00:00.000Z");
    expect(out[6].date).toBe("2026-11-12T00:00:00.000Z");
  });
  it("fills gaps and keeps counts", () => {
    const out = fillBuckets({
      rows: [
        { bucket: new Date("2026-11-08T00:00:00Z"), count: 3 },
        { bucket: new Date("2026-11-12T00:00:00Z"), count: 1 },
      ],
      range: 7,
      granularity: "day",
      now,
    });
    expect(out.map((p) => p.count)).toEqual([0, 0, 3, 0, 0, 0, 1]);
  });
  it("buckets by week across a month boundary", () => {
    const out = fillBuckets({ rows: [], range: 30, granularity: "week", now });
    expect(out[0].date).toBe("2026-10-12T00:00:00.000Z");
    expect(out.at(-1)?.date).toBe("2026-11-09T00:00:00.000Z");
    expect(out).toHaveLength(5);
  });
  it("buckets by month across a year boundary", () => {
    const jan = new Date("2027-01-10T00:00:00Z");
    const out = fillBuckets({
      rows: [{ bucket: new Date("2026-12-01T00:00:00Z"), count: 2 }],
      range: 90,
      granularity: "month",
      now: jan,
    });
    expect(out.map((p) => p.date.slice(0, 7))).toEqual(["2026-10", "2026-11", "2026-12", "2027-01"]);
    expect(out.map((p) => p.count)).toEqual([0, 0, 2, 0]);
  });
});

describe("planUsage", () => {
  it("free plan spaces", () => {
    expect(planUsage({ plan: "free", spaceCount: 2 })).toEqual({
      spaces: { used: 2, limit: 3 },
      perSpace: undefined,
    });
  });
  it("pro per-space usage with capped ratio", () => {
    const u = planUsage({ plan: "pro", spaceCount: 5, spaceTestimonialCount: 250 });
    expect(u.spaces).toEqual({ used: 5, limit: 25 });
    expect(u.perSpace).toEqual({ used: 250, limit: 1000, ratio: 0.25 });
    expect(planUsage({ plan: "free", spaceCount: 1, spaceTestimonialCount: 150 }).perSpace?.ratio).toBe(1);
  });
});
