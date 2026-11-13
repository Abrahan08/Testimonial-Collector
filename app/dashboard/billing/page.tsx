import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_COMPARISON } from "@/lib/billing";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CancelButton } from "./cancel-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

async function Billing({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const raw = await searchParams;
  const success = raw.success === "1";

  // Plan always comes from the database, never from the session.
  const owner = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true, currentPeriodEnd: true },
  });
  const plan = owner?.plan ?? "free";

  return (
    <>
      <p role="note" className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Demo billing: no real payments are made.
      </p>

      {success && plan === "pro" && (
        <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          Upgrade complete. Your Pro limits are active now.
        </p>
      )}

      {plan === "pro" && (
        <section aria-label="Subscription" className="flex flex-col gap-2 rounded-xl p-4 ring-1 ring-foreground/10">
          <h2 className="font-medium">You&apos;re on Pro</h2>
          {owner?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">Renews on {formatDate(owner.currentPeriodEnd)}</p>
          )}
          <div>
            <CancelButton />
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {PLAN_COMPARISON.map((p) => {
          const current = p.key === plan;
          return (
            <Card
              key={p.key}
              data-testid={`plan-${p.key}`}
              aria-current={current ? "true" : undefined}
              className={current ? "ring-2 ring-primary" : undefined}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {p.name}
                  {current && <Badge>Current plan</Badge>}
                </CardTitle>
                <CardDescription>{p.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ul className="flex flex-col gap-1 text-sm">
                  <li>{p.spaces} spaces</li>
                  <li>{p.testimonialsPerSpace.toLocaleString("en-US")} testimonials per space</li>
                </ul>
                {p.key === "pro" && plan === "free" && (
                  <Link href="/dashboard/billing/checkout" className={buttonVariants()}>
                    Upgrade
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export default function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Billing</h1>
      <Suspense fallback={null}>
        <Billing searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
