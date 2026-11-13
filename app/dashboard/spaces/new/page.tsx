import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { canCreateSpace, canUpgrade } from "@/lib/limits";
import { PLAN_LIMITS } from "@/lib/plans";
import { requireUser } from "@/lib/session";
import { SpaceForm } from "../space-form";

// PRD 5.9: when the space limit is reached, "New space" shows an upgrade prompt instead of
// the form. The server action still enforces the limit (403 state); this is only the early prompt.
async function NewSpace() {
  const user = await requireUser();
  const [owner, count] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
    db.space.count({ where: { ownerId: user.id } }),
  ]);
  const plan = owner?.plan ?? "free";

  if (canCreateSpace(plan, count)) return <SpaceForm />;

  const limit = PLAN_LIMITS[plan].spaces;
  const upgradable = canUpgrade(plan);
  return (
    <Card className="mx-auto w-full max-w-xl" data-testid="space-limit-prompt">
      <CardHeader>
        <CardTitle>Space limit reached</CardTitle>
        <CardDescription>
          {upgradable
            ? `The Free plan includes ${limit} spaces and you are using all of them. Upgrade to Pro to create up to ${PLAN_LIMITS.pro.spaces}.`
            : `Your plan includes ${limit} spaces and you are using all of them. Delete a space you no longer need to make room for a new one.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        {upgradable ? (
          <Link href="/dashboard/billing" className={buttonVariants()}>
            Upgrade to Pro
          </Link>
        ) : null}
        <Link href="/dashboard/spaces" className={buttonVariants({ variant: upgradable ? "outline" : "default" })}>
          Back to spaces
        </Link>
      </CardContent>
    </Card>
  );
}

export default function NewSpacePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <NewSpace />
      </Suspense>
    </main>
  );
}
