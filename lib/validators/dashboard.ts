import { z } from "zod";

export const RANGES = [7, 30, 90] as const;
export const GRANULARITIES = ["day", "week", "month"] as const;
export type Range = (typeof RANGES)[number];
export type Granularity = (typeof GRANULARITIES)[number];

// Query params are untrusted; anything invalid falls back to a default.
export const dashboardQuerySchema = z.object({
  space: z.string().trim().max(64).optional().catch(undefined),
  range: z.coerce
    .number()
    .pipe(z.union([z.literal(7), z.literal(30), z.literal(90)]))
    .catch(30),
  granularity: z.enum(GRANULARITIES).catch("day"),
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
