import { PLAN_LIMITS, TESTIMONIAL_WARNING_RATIO, type PlanKey } from "@/lib/plans";
import { PAGE_SIZE, type InboxStatus } from "@/lib/validators/inbox";

// Pure helpers behind the inbox page, kept free of Prisma imports so they are easy to test.

export function buildInboxWhere({ spaceId, status, q }: { spaceId: string; status: InboxStatus; q: string }) {
  const search = q.trim();
  return {
    spaceId,
    ...(status === "favorites" && { isFavorite: true }),
    ...(status === "wall" && { isWallOfLove: true }),
    ...(status === "hidden" && { isHidden: true }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { text: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };
}

// Favorites pinned first, then newest first; id makes paging stable.
export function buildInboxOrder() {
  return [{ isFavorite: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
}

export function totalPages(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function clampPage(page: number, total: number) {
  return Math.min(Math.max(1, page), totalPages(total));
}

export function pageToSkip(page: number) {
  return (Math.max(1, page) - 1) * PAGE_SIZE;
}

export type CountWarning = { level: "none" | "warning" | "full"; used: number; limit: number };

export function countWarning(plan: PlanKey, used: number): CountWarning {
  const limit = PLAN_LIMITS[plan].testimonialsPerSpace;
  if (used >= limit) return { level: "full", used, limit };
  if (used >= limit * TESTIMONIAL_WARNING_RATIO) return { level: "warning", used, limit };
  return { level: "none", used, limit };
}

// Ownership as a pure check; the database queries enforce the same rule in their where clause.
export function isOwnedBy(space: { ownerId: string } | null | undefined, userId: string): boolean {
  return !!space && space.ownerId === userId;
}

// Picks the selected space: the requested one only if the owner has it, else the newest.
export function pickSpace<T extends { id: string }>(spacesNewestFirst: T[], requestedId: string | undefined): T | null {
  return spacesNewestFirst.find((s) => s.id === requestedId) ?? spacesNewestFirst[0] ?? null;
}

export function inboxHref(params: { space?: string; status?: InboxStatus; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.space) sp.set("space", params.space);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/dashboard/inbox?${qs}` : "/dashboard/inbox";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = Array.from(parts[0])[0] ?? "?";
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}
