import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { THEME_KEYS } from "@/lib/themes";
import { spaceFieldsSchema } from "@/lib/validators/space";
import { SpaceForm, type SpaceFormInitial } from "../../space-form";

async function EditSpace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  // Scoped by owner: another owner's id is a 404.
  const space = await db.space.findFirst({ where: { id, ownerId: user.id } });
  if (!space) notFound();

  const parsedFields = spaceFieldsSchema.safeParse(space.fields);
  const list = parsedFields.success ? parsedFields.data : [];
  const get = (key: string) => {
    const f = list.find((x) => x.key === key);
    return { enabled: f?.enabled ?? false, required: f?.required ?? false };
  };
  const theme = THEME_KEYS.find((k) => k === space.theme) ?? "light";

  const initial: SpaceFormInitial = {
    name: space.name,
    title: space.title,
    subtitle: space.subtitle,
    ask: space.ask,
    collectRating: space.collectRating,
    theme,
    fields: { company: get("company"), socialLink: get("socialLink"), photo: get("photo") },
  };
  return <SpaceForm mode="edit" spaceId={space.id} slug={space.slug} initial={initial} />;
}

export default function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col">
      <Suspense fallback={null}>
        <EditSpace params={params} />
      </Suspense>
    </main>
  );
}
