import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { publicSpaceUrl } from "@/lib/urls";
import { SpaceCard } from "./space-card";

async function SpaceList() {
  const user = await requireUser();
  const spaces = await db.space.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, createdAt: true, _count: { select: { testimonials: true } } },
  });

  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl p-12 text-center ring-1 ring-foreground/10">
        <p className="font-medium">No spaces yet</p>
        <p className="text-sm text-muted-foreground">A space is where you collect testimonials from your customers.</p>
        <Link href="/dashboard/spaces/new" className={buttonVariants()}>
          Create your first space
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spaces.map((s) => (
        <SpaceCard
          key={s.id}
          id={s.id}
          name={s.name}
          testimonialCount={s._count.testimonials}
          publicUrl={publicSpaceUrl(s.slug)}
          createdAt={s.createdAt.toISOString()}
        />
      ))}
    </div>
  );
}

export default function SpacesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Spaces</h1>
        <Link href="/dashboard/spaces/new" className={buttonVariants({ size: "sm" })}>
          New space
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <SpaceList />
      </Suspense>
    </main>
  );
}
