import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { EmbedHeightReporter } from "@/components/embed/embed-height-reporter";
import { TestimonialWall, type WallTestimonial } from "@/components/embed/testimonial-wall";
import { db } from "@/lib/db";
import { EMBED_LIMIT, EMBED_ORDER, EMBED_SELECT, buildEmbedWhere } from "@/lib/embed-query";
import { shouldShowPoweredBy } from "@/lib/powered-by";
import { parseEmbedParams, resolveEmbedOptions, type SavedEmbedConfig } from "@/lib/validators/embed";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Cached for ~60s per slug. Returns only public fields: no email, no consent flag, no ids.
// Only a `showBadge` boolean derived from the owner's plan leaves this function, never the plan.
async function getEmbedData(
  slug: string,
): Promise<{ saved: SavedEmbedConfig | null; items: WallTestimonial[]; showBadge: boolean } | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const space = await db.space.findUnique({
    where: { slug },
    select: {
      id: true,
      owner: { select: { plan: true } },
      embedConfig: { select: { style: true, darkMode: true, animation: true, backgroundColor: true, source: true } },
    },
  });
  if (!space) return null;

  const config = space.embedConfig;
  const rows = await db.testimonial.findMany({
    where: buildEmbedWhere(space.id, config?.source ?? "all_visible"),
    orderBy: EMBED_ORDER,
    take: EMBED_LIMIT,
    select: EMBED_SELECT,
  });

  return {
    saved: config
      ? {
          style: config.style,
          darkMode: config.darkMode,
          animation: config.animation,
          backgroundColor: config.backgroundColor,
        }
      : null,
    items: rows.map((r) => ({ name: r.name, company: r.company, rating: r.rating, text: r.text })),
    showBadge: shouldShowPoweredBy(space.owner.plan),
  };
}

async function EmbedContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const data = await getEmbedData(slug);
  if (!data) notFound();

  const options = resolveEmbedOptions(
    parseEmbedParams({
      style: first(raw.style),
      dark: first(raw.dark),
      animation: first(raw.animation),
      bg: first(raw.bg),
    }),
    data.saved,
  );

  // Nothing to show: the live widget renders nothing (PRD 5.9).
  return (
    <>
      <TestimonialWall
        testimonials={data.items}
        style={options.style}
        dark={options.dark}
        animation={options.animation}
        bg={options.bg}
        poweredBy={data.showBadge}
      />
      <EmbedHeightReporter />
    </>
  );
}

export default function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={null}>
      <EmbedContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
