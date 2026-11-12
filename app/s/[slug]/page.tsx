import { readdir } from "node:fs/promises";
import path from "node:path";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ClosedNotice, PublicFormClient } from "@/components/space/public-form-client";
import { db } from "@/lib/db";
import { CLOSED_MESSAGE, canAcceptTestimonial } from "@/lib/limits";
import { spaceFieldsSchema } from "@/lib/validators/space";
import { submitTestimonialAction } from "./actions";

const IMAGE_EXT = /\.(gif|png|jpe?g|webp)$/i;

// Image files in public/gifs/ (missing or empty folder gives []). Local assets only.
async function listGifs(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "gifs"));
    return files.filter((f) => IMAGE_EXT.test(f)).map((f) => `/gifs/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}

async function PublicSpace({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Public config only. ownerId and owner details are never selected; the owner's plan is
  // read for the limit check and stays on the server.
  const space = await db.space.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      subtitle: true,
      ask: true,
      collectRating: true,
      theme: true,
      fields: true,
      owner: { select: { plan: true } },
    },
  });
  if (!space) notFound();

  const fields = spaceFieldsSchema.safeParse(space.fields);
  if (!fields.success) notFound();

  const count = await db.testimonial.count({ where: { spaceId: space.id } });
  if (!canAcceptTestimonial(space.owner.plan, count)) {
    return <ClosedNotice message={CLOSED_MESSAGE} theme={space.theme} />;
  }

  return (
    <PublicFormClient
      title={space.title}
      subtitle={space.subtitle}
      ask={space.ask}
      collectRating={space.collectRating}
      theme={space.theme}
      fields={fields.data}
      gifs={await listGifs()}
      action={submitTestimonialAction.bind(null, slug)}
      closedMessage={CLOSED_MESSAGE}
    />
  );
}

export default function PublicSpacePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-6">
      <Suspense fallback={null}>
        <PublicSpace params={params} />
      </Suspense>
    </main>
  );
}
