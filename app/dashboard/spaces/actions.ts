"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { canCreateSpace } from "@/lib/limits";
import { requireUser } from "@/lib/session";
import { generateSlug } from "@/lib/slug";
import { FIELD_KEYS, createSpaceSchema, deleteSpaceSchema, updateSpaceSchema } from "@/lib/validators/space";

export type CreateSpaceState = {
  fieldErrors?: Partial<Record<"name" | "title" | "subtitle" | "ask" | "theme" | "fields", string[]>>;
  formError?: string;
  // 403 when the plan's space limit is reached.
  status?: 403;
  limitReached?: boolean;
};

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Rebuild the fields array from the form. Name and email are forced on/required
// by the schema check, so tampering with them is rejected rather than trusted.
function readFields(formData: FormData) {
  return FIELD_KEYS.map((key) => {
    if (key === "name" || key === "email") return { key, enabled: true, required: true };
    return {
      key,
      enabled: formData.get(`field_${key}_enabled`) === "on",
      required: formData.get(`field_${key}_required`) === "on",
    };
  });
}

// Only these form keys are ever read, so slug/ownerId in a forged submission are ignored.
function readSpaceForm(formData: FormData) {
  return {
    name: str(formData, "name"),
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    ask: str(formData, "ask"),
    collectRating: formData.get("collectRating") === "on",
    theme: str(formData, "theme"),
    fields: readFields(formData),
  };
}

const MAX_SLUG_ATTEMPTS = 5;

export async function createSpaceAction(_prev: CreateSpaceState, formData: FormData): Promise<CreateSpaceState> {
  const user = await requireUser();

  const parsed = createSpaceSchema.safeParse(readSpaceForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let id: string | null = null;
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS && !id; attempt++) {
    try {
      // The owner row is locked so concurrent creates serialize: the count
      // and the insert cannot interleave and exceed the plan limit.
      const result = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
        const owner = await tx.user.findUnique({ where: { id: user.id }, select: { plan: true } });
        if (!owner) return { kind: "no-user" as const };
        const count = await tx.space.count({ where: { ownerId: user.id } });
        if (!canCreateSpace(owner.plan, count)) return { kind: "limit" as const };
        const space = await tx.space.create({
          data: { ...parsed.data, ownerId: user.id, slug: generateSlug(parsed.data.name) },
          select: { id: true },
        });
        return { kind: "ok" as const, id: space.id };
      });
      if (result.kind === "no-user") redirect("/login");
      if (result.kind === "limit") {
        return {
          status: 403,
          limitReached: true,
          formError: "You have reached the space limit for your plan. Upgrade to Pro to create more spaces.",
        };
      }
      id = result.id;
    } catch (error) {
      // Slug collision: retry with a fresh suffix.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      return { formError: "Could not create the space. Please try again." };
    }
  }
  if (!id) return { formError: "Could not create the space. Please try again." };

  revalidatePath("/dashboard/spaces");
  redirect(`/dashboard/spaces/${id}/created`);
}

// Bound with the space id in the form: updateSpaceAction.bind(null, id).
export async function updateSpaceAction(
  spaceId: string,
  _prev: CreateSpaceState,
  formData: FormData,
): Promise<CreateSpaceState> {
  const user = await requireUser();

  const parsed = updateSpaceSchema.safeParse(readSpaceForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Explicit field list: slug and ownerId can never be written here. Turning a
  // field off only edits the `fields` JSON; testimonials are not touched.
  const { name, title, subtitle, ask, collectRating, theme, fields } = parsed.data;
  let count = 0;
  try {
    // Scoped by owner: someone else's id looks the same as a missing one.
    ({ count } = await db.space.updateMany({
      where: { id: spaceId, ownerId: user.id },
      data: { name, title, subtitle, ask, collectRating, theme, fields },
    }));
  } catch {
    return { formError: "Could not save the space. Please try again." };
  }
  if (count === 0) notFound();

  revalidatePath("/dashboard/spaces");
  redirect("/dashboard/spaces?updated=1");
}

export type DeleteSpaceState ={ error?: string; notFound?: boolean };

export async function deleteSpaceAction(input: { id: string; confirmName: string }): Promise<DeleteSpaceState> {
  const user = await requireUser();
  const parsed = deleteSpaceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request" };

  // Scoped by owner: someone else's id looks the same as a missing one.
  const space = await db.space.findFirst({
    where: { id: parsed.data.id, ownerId: user.id },
    select: { id: true, name: true },
  });
  if (!space) return { notFound: true, error: "Space not found" };

  if (parsed.data.confirmName !== space.name) {
    return { error: "The name you typed does not match" };
  }

  await db.space.deleteMany({ where: { id: space.id, ownerId: user.id } });
  revalidatePath("/dashboard/spaces");
  return {};
}
