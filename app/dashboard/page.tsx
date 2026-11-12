import { Suspense } from "react";
import Link from "next/link";
import { SubmissionsChart } from "@/components/dashboard/submissions-chart";
import { OverviewFilters } from "@/components/dashboard/overview-filters";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getCounters, getRecent, getSeries } from "@/lib/dashboard-queries";
import { fillBuckets, planUsage, rangeStart } from "@/lib/dashboard-stats";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dashboardQuerySchema, type Granularity } from "@/lib/validators/dashboard";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function bucketLabel(iso: string, granularity: Granularity) {
  const d = new Date(iso);
  if (granularity === "month") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function Counter({ label, value }: { label: string; value: string | number }) {
  return (
    <Card size="sm" className="px-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold" data-testid={`counter-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value}
      </p>
    </Card>
  );
}

function UpgradeBanner() {
  return (
    <div
      role="note"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"
    >
      <span>Upgrade to Pro for 25 spaces and 1,000 testimonials per space</span>
      <Link href="/dashboard/billing" className={buttonVariants({ size: "sm" })}>
        Upgrade
      </Link>
    </div>
  );
}

async function Overview({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const raw = await searchParams;
  const query = dashboardQuerySchema.parse({
    space: first(raw.space),
    range: first(raw.range),
    granularity: first(raw.granularity),
  });

  const [owner, spaces] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
    db.space.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);
  const plan = owner?.plan ?? "free";

  if (spaces.length === 0) {
    return (
      <>
        {plan === "free" && <UpgradeBanner />}
        <div className="flex flex-col items-center gap-3 rounded-xl p-12 text-center ring-1 ring-foreground/10">
          <p className="font-medium">No spaces yet</p>
          <p className="text-sm text-muted-foreground">Create a space to start collecting testimonials.</p>
          <Link href="/dashboard/spaces/new" className={buttonVariants()}>
            Create your first space
          </Link>
        </div>
      </>
    );
  }

  // A foreign or unknown ?space= falls back to "All".
  const spaceId = spaces.find((s) => s.id === query.space)?.id;
  const now = new Date();

  const [counters, rows, recent] = await Promise.all([
    getCounters(user.id, spaceId),
    getSeries(user.id, spaceId, rangeStart(now, query.range), query.granularity),
    getRecent(user.id, spaceId),
  ]);
  const series = fillBuckets({ rows, range: query.range, granularity: query.granularity, now });
  const hasData = series.some((p) => p.count > 0);
  const usage = planUsage({
    plan,
    spaceCount: spaces.length,
    spaceTestimonialCount: spaceId ? counters.total : undefined,
  });
  const meterRatio = usage.perSpace ? usage.perSpace.ratio : Math.min(1, usage.spaces.used / usage.spaces.limit);

  return (
    <>
      {plan === "free" && <UpgradeBanner />}
      <OverviewFilters spaces={spaces} spaceId={spaceId} range={query.range} granularity={query.granularity} />

      <section aria-label="Counters" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Counter label="Testimonials" value={counters.total} />
        <Counter label="Unique customers" value={counters.uniqueCustomers} />
        <Counter label="Spaces" value={counters.spaces} />
        <Counter
          label="Average rating"
          value={counters.averageRating === null ? "-" : counters.averageRating.toFixed(1)}
        />
        <Counter label="Favorites" value={counters.favorites} />
        <Counter label="Wall of love" value={counters.wallOfLove} />
      </section>

      <Card className="px-4">
        <h2 className="font-medium">Testimonials collected</h2>
        {hasData ? (
          <SubmissionsChart
            data={series.map((p) => ({ label: bucketLabel(p.date, query.granularity), count: p.count }))}
          />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground" data-testid="chart-empty">
            No testimonials in this period.
          </p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="px-4">
          <h2 className="font-medium">Plan usage</h2>
          <p className="text-sm" data-testid="usage-spaces">
            {usage.spaces.used} of {usage.spaces.limit} spaces
          </p>
          {usage.perSpace && (
            <p className="text-sm" data-testid="usage-testimonials">
              {usage.perSpace.used} of {usage.perSpace.limit} testimonials in this space
            </p>
          )}
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${Math.round(meterRatio * 100)}%` }} />
          </div>
        </Card>

        <Card className="px-4">
          <h2 className="font-medium">Recent submissions</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.space.name} · {t.rating === null ? "No rating" : `${t.rating}/5`} ·{" "}
                      {t.createdAt.toLocaleDateString("en-US", { timeZone: "UTC" })}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/inbox?space=${encodeURIComponent(t.space.id)}`}
                    className="shrink-0 text-xs underline"
                  >
                    View in inbox
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Overview</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <Overview searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
