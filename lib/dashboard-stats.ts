import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";
import type { Granularity, Range } from "@/lib/validators/dashboard";

const DAY_MS = 86_400_000;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Start of the window: UTC midnight, `range` days including today.
export function rangeStart(now: Date, range: Range): Date {
  return new Date(startOfUtcDay(now).getTime() - (range - 1) * DAY_MS);
}

// Start of the UTC bucket containing `d` (weeks start on Monday, like date_trunc).
export function bucketStart(d: Date, granularity: Granularity): Date {
  const day = startOfUtcDay(d);
  if (granularity === "day") return day;
  if (granularity === "week") {
    const sinceMonday = (day.getUTCDay() + 6) % 7;
    return new Date(day.getTime() - sinceMonday * DAY_MS);
  }
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
}

function nextBucket(d: Date, granularity: Granularity): Date {
  if (granularity === "day") return new Date(d.getTime() + DAY_MS);
  if (granularity === "week") return new Date(d.getTime() + 7 * DAY_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

export type SeriesRow = { bucket: Date; count: number };
export type SeriesPoint = { date: string; count: number };

// Fills buckets with no rows with 0 so the chart has no gaps.
export function fillBuckets({
  rows,
  range,
  granularity,
  now,
}: {
  rows: SeriesRow[];
  range: Range;
  granularity: Granularity;
  now: Date;
}): SeriesPoint[] {
  const counts = new Map<number, number>();
  for (const r of rows) {
    const key = bucketStart(r.bucket, granularity).getTime();
    counts.set(key, (counts.get(key) ?? 0) + r.count);
  }
  const points: SeriesPoint[] = [];
  const last = bucketStart(now, granularity).getTime();
  for (let d = bucketStart(rangeStart(now, range), granularity); d.getTime() <= last; d = nextBucket(d, granularity)) {
    points.push({ date: d.toISOString(), count: counts.get(d.getTime()) ?? 0 });
  }
  return points;
}

export function planUsage({
  plan,
  spaceCount,
  spaceTestimonialCount,
}: {
  plan: PlanKey;
  spaceCount: number;
  spaceTestimonialCount?: number;
}) {
  const limits = PLAN_LIMITS[plan];
  return {
    spaces: { used: spaceCount, limit: limits.spaces },
    perSpace:
      spaceTestimonialCount === undefined
        ? undefined
        : {
            used: spaceTestimonialCount,
            limit: limits.testimonialsPerSpace,
            ratio: Math.min(1, spaceTestimonialCount / limits.testimonialsPerSpace),
          },
  };
}
