import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { EMBED_LIMIT, EMBED_ORDER, EMBED_SELECT, buildEmbedWhere } from "@/lib/embed-query";
import { pickSpace } from "@/lib/inbox-query";
import { requireUser } from "@/lib/session";
import { appBaseUrl } from "@/lib/urls";
import { EmbedBuilder } from "./embed-builder";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function EmbedContent({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const raw = await searchParams;
  const requested = Array.isArray(raw.space) ? raw.space[0] : raw.space;

  // Only the owner's own spaces are candidates, so a foreign ?space= falls back to the newest.
  const spaces = await db.space.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true },
  });
  const space = pickSpace(spaces, requested);

  if (!space) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl p-12 text-center ring-1 ring-foreground/10">
        <p className="font-medium">No spaces yet</p>
        <p className="text-sm text-muted-foreground">Create a space to build an embed.</p>
        <Link href="/dashboard/spaces/new" className={buttonVariants()}>
          Create your first space
        </Link>
      </div>
    );
  }

  const config = await db.embedConfig.findUnique({ where: { spaceId: space.id } });
  const rows = await db.testimonial.findMany({
    where: buildEmbedWhere(space.id, "all_visible"),
    orderBy: EMBED_ORDER,
    take: EMBED_LIMIT,
    select: { ...EMBED_SELECT, isWallOfLove: true },
  });

  return (
    <EmbedBuilder
      key={space.id}
      spaces={spaces.map((s) => ({ id: s.id, name: s.name }))}
      spaceId={space.id}
      slug={space.slug}
      appUrl={appBaseUrl()}
      initial={{
        style: config?.style ?? "masonry",
        darkMode: config?.darkMode ?? false,
        animation: config?.animation ?? true,
        backgroundColor: config?.backgroundColor ?? "#ffffff",
        source: config?.source ?? "all_visible",
      }}
      // The preview applies the source filter on the client, so the wall-of-love flag is passed along.
      testimonials={rows.map((r) => ({
        name: r.name,
        company: r.company,
        rating: r.rating,
        text: r.text,
        isWallOfLove: r.isWallOfLove,
      }))}
    />
  );
}

export default function EmbedBuilderPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="text-xl font-semibold">Embed</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <EmbedContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
