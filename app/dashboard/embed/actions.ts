"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { embedConfigInputSchema, type EmbedConfigInput } from "@/lib/validators/embed";

export type SaveEmbedState = { ok?: boolean; formError?: string };

// Upsert one EmbedConfig per space. The space is looked up with the signed-in owner, so a
// foreign space id is indistinguishable from a missing one (404).
export async function saveEmbedConfigAction(input: EmbedConfigInput): Promise<SaveEmbedState> {
  const user = await requireUser();
  const parsed = embedConfigInputSchema.safeParse(input);
  if (!parsed.success) {
    const idOk = embedConfigInputSchema.shape.spaceId.safeParse((input as { spaceId?: unknown })?.spaceId).success;
    if (!idOk) notFound();
    return { formError: "Check the settings and try again." };
  }
  const { spaceId, style, darkMode, animation, backgroundColor, source } = parsed.data;

  const space = await db.space.findFirst({ where: { id: spaceId, ownerId: user.id }, select: { id: true } });
  if (!space) notFound();

  const data = { style, darkMode, animation, backgroundColor, source };
  await db.embedConfig.upsert({
    where: { spaceId: space.id },
    create: { spaceId: space.id, ...data },
    update: data,
  });

  revalidatePath("/dashboard/embed");
  return { ok: true };
}
