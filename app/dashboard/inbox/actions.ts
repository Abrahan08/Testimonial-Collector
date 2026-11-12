"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { editTestimonialSchema, idSchema, setFlagSchema, type EditTestimonialInput } from "@/lib/validators/inbox";

export type EditTestimonialState = {
  ok?: boolean;
  fieldErrors?: Partial<Record<"name" | "text" | "rating", string[]>>;
  formError?: string;
};

function refresh() {
  revalidatePath("/dashboard/inbox");
}

// Every mutation scopes by the owner through the testimonial's space; a foreign id
// matches nothing and looks exactly like a missing one (404).
async function setFlag(field: "isFavorite" | "isWallOfLove" | "isHidden", input: { id: string; value: boolean }) {
  const user = await requireUser();
  const parsed = setFlagSchema.safeParse(input);
  if (!parsed.success) notFound();
  const { count } = await db.testimonial.updateMany({
    where: { id: parsed.data.id, space: { ownerId: user.id } },
    data: { [field]: parsed.data.value },
  });
  if (count === 0) notFound();
  refresh();
}

export async function setFavoriteAction(input: { id: string; value: boolean }) {
  await setFlag("isFavorite", input);
}

export async function setWallOfLoveAction(input: { id: string; value: boolean }) {
  await setFlag("isWallOfLove", input);
}

export async function setHiddenAction(input: { id: string; value: boolean }) {
  await setFlag("isHidden", input);
}

export async function editTestimonialAction(input: EditTestimonialInput): Promise<EditTestimonialState> {
  const user = await requireUser();
  const parsed = editTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    // An id that fails validation can never match anything, so it is a 404, not a field error.
    if (!idSchema.safeParse(input?.id).success) notFound();
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { id, name, text, rating } = parsed.data;

  const existing = await db.testimonial.findFirst({
    where: { id, space: { ownerId: user.id } },
    select: { id: true, space: { select: { collectRating: true } } },
  });
  if (!existing) notFound();

  // Only name, text and rating are written; email is never editable. Rating is
  // ignored when the space does not collect ratings.
  const data = existing.space.collectRating && rating !== undefined ? { name, text, rating } : { name, text };
  let count = 0;
  try {
    ({ count } = await db.testimonial.updateMany({ where: { id, space: { ownerId: user.id } }, data }));
  } catch {
    return { formError: "Could not save the testimonial. Please try again." };
  }
  if (count === 0) notFound();
  refresh();
  return { ok: true };
}

export async function deleteTestimonialAction(input: { id: string }) {
  const user = await requireUser();
  const parsed = idSchema.safeParse(input?.id);
  if (!parsed.success) notFound();
  const { count } = await db.testimonial.deleteMany({ where: { id: parsed.data, space: { ownerId: user.id } } });
  if (count === 0) notFound();
  refresh();
}
