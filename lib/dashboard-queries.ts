import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import type { SeriesRow } from "@/lib/dashboard-stats";
import type { Granularity } from "@/lib/validators/dashboard";

// All queries are scoped to the owner (testimonials through their spaces).
// `spaceId` must already be validated against the owner's own spaces.

// date_trunc's unit cannot be a bind parameter, so it comes from this fixed lookup.
const UNIT = {
  day: Prisma.sql`'day'`,
  week: Prisma.sql`'week'`,
  month: Prisma.sql`'month'`,
} as const satisfies Record<Granularity, Prisma.Sql>;

function where(ownerId: string, spaceId?: string): Prisma.TestimonialWhereInput {
  return { space: { ownerId, ...(spaceId ? { id: spaceId } : {}) } };
}

export async function getCounters(ownerId: string, spaceId?: string) {
  const w = where(ownerId, spaceId);
  const spaceFilter = spaceId ? Prisma.sql`AND s."id" = ${spaceId}` : Prisma.empty;
  const [total, avg, favorites, wall, spaces, unique] = await Promise.all([
    db.testimonial.count({ where: w }),
    db.testimonial.aggregate({ where: { ...w, rating: { not: null } }, _avg: { rating: true } }),
    db.testimonial.count({ where: { ...w, isFavorite: true } }),
    db.testimonial.count({ where: { ...w, isWallOfLove: true } }),
    db.space.count({ where: { ownerId } }),
    db.$queryRaw<{ n: number }[]>`
      SELECT COUNT(DISTINCT lower(t."email"))::int AS n
      FROM "Testimonial" t JOIN "Space" s ON s."id" = t."spaceId"
      WHERE s."ownerId" = ${ownerId} ${spaceFilter}`,
  ]);
  return {
    total,
    uniqueCustomers: unique[0]?.n ?? 0,
    spaces,
    averageRating: avg._avg.rating,
    favorites,
    wallOfLove: wall,
  };
}

export async function getSeries(
  ownerId: string,
  spaceId: string | undefined,
  from: Date,
  granularity: Granularity,
): Promise<SeriesRow[]> {
  const spaceFilter = spaceId ? Prisma.sql`AND s."id" = ${spaceId}` : Prisma.empty;
  return db.$queryRaw<SeriesRow[]>`
    SELECT date_trunc(${UNIT[granularity]}, t."createdAt") AS bucket, COUNT(*)::int AS count
    FROM "Testimonial" t JOIN "Space" s ON s."id" = t."spaceId"
    WHERE s."ownerId" = ${ownerId} ${spaceFilter} AND t."createdAt" >= ${from}
    GROUP BY 1 ORDER BY 1`;
}

export async function getRecent(ownerId: string, spaceId?: string) {
  return db.testimonial.findMany({
    where: where(ownerId, spaceId),
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      rating: true,
      createdAt: true,
      space: { select: { id: true, name: true } },
    },
  });
}
