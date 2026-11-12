import { Suspense } from "react";
import Link from "next/link";
import { CopyButton } from "@/app/dashboard/spaces/[id]/created/copy-button";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import {
  buildInboxOrder,
  buildInboxWhere,
  clampPage,
  countWarning,
  inboxHref,
  pageToSkip,
  pickSpace,
  totalPages,
} from "@/lib/inbox-query";
import { requireUser } from "@/lib/session";
import { publicSpaceUrl } from "@/lib/urls";
import { PAGE_SIZE, inboxQuerySchema } from "@/lib/validators/inbox";
import { InboxFilters } from "./inbox-filters";
import { TestimonialRow } from "./testimonial-row";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function InboxContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const raw = await searchParams;
  const query = inboxQuerySchema.parse({
    space: first(raw.space),
    status: first(raw.status),
    q: first(raw.q),
    page: first(raw.page),
  });

  // Only the owner's own spaces are ever candidates, so a foreign ?space= falls back to the newest.
  const [owner, spaces] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
    db.space.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, collectRating: true },
    }),
  ]);
  const space = pickSpace(spaces, query.space);

  if (!space) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl p-12 text-center ring-1 ring-foreground/10">
        <p className="font-medium">No spaces yet</p>
        <p className="text-sm text-muted-foreground">Create a space to start collecting testimonials.</p>
        <Link href="/dashboard/spaces/new" className={buttonVariants()}>
          Create your first space
        </Link>
      </div>
    );
  }

  const where = buildInboxWhere({ spaceId: space.id, status: query.status, q: query.q });
  const [spaceTotal, filteredTotal] = await Promise.all([
    db.testimonial.count({ where: { spaceId: space.id } }),
    db.testimonial.count({ where }),
  ]);
  const page = clampPage(query.page, filteredTotal);
  const rows = await db.testimonial.findMany({
    where,
    orderBy: buildInboxOrder(),
    skip: pageToSkip(page),
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      text: true,
      rating: true,
      photoUrl: true,
      consentToShare: true,
      isFavorite: true,
      isWallOfLove: true,
      isHidden: true,
      createdAt: true,
    },
  });

  const warning = countWarning(owner?.plan ?? "free", spaceTotal);
  const pages = totalPages(filteredTotal);
  const filtered = query.status !== "all" || query.q !== "";

  return (
    <>
      <InboxFilters
        spaces={spaces.map((s) => ({ id: s.id, name: s.name }))}
        spaceId={space.id}
        status={query.status}
        q={query.q}
      />

      {warning.level !== "none" && (
        <p
          role="status"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
          data-testid="count-warning"
        >
          {warning.level === "full"
            ? `This space is full: ${warning.used} of ${warning.limit} testimonials used. It is not accepting new testimonials.`
            : `${warning.used} of ${warning.limit} testimonials used`}
        </p>
      )}

      {spaceTotal === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl p-12 text-center ring-1 ring-foreground/10">
          <p className="font-medium">No testimonials yet</p>
          <p className="text-sm text-muted-foreground">Share your public link to start collecting them.</p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 text-sm">{publicSpaceUrl(space.slug)}</code>
            <CopyButton text={publicSpaceUrl(space.slug)} />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          {filtered ? "No testimonials match these filters." : "No testimonials."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((t) => (
            <TestimonialRow
              key={t.id}
              collectRating={space.collectRating}
              item={{ ...t, createdAt: t.createdAt.toISOString() }}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={inboxHref({ space: space.id, status: query.status, q: query.q, page: page - 1 })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={inboxHref({ space: space.id, status: query.status, q: query.q, page: page + 1 })}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

export default function InboxPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Inbox</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <InboxContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
