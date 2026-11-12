"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { CLOSED_MESSAGE, canAcceptTestimonial } from "@/lib/limits";
import { SUBMISSION_LIMIT, checkRateLimits, submissionStore } from "@/lib/rate-limit";
import { spaceFieldsSchema } from "@/lib/validators/space";
import { buildTestimonialSchema } from "@/lib/validators/testimonial";



export type SubmitState = {
  ok?: boolean;
  // Mirrors the HTTP semantics (a server action cannot set a response status).
  status?: 404 | 409 | 429 | 500;
  closed?: boolean;
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  // Echoed back so the customer's input survives an error.
  values?: Record<string, string | boolean>;
};

const HONEYPOT = "hp_website";
const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/i);

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function readValues(formData: FormData): Record<string, string | boolean> {
  return {
    name: str(formData, "name"),
    email: str(formData, "email"),
    company: str(formData, "company"),
    socialLink: str(formData, "socialLink"),
    text: str(formData, "text"),
    rating: str(formData, "rating"),
    consentToShare: formData.get("consentToShare") === "on",
  };
}

async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

// Bound with the slug: submitTestimonialAction.bind(null, slug).
export async function submitTestimonialAction(
  slug: string,
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // Honeypot: bots fill it. Pretend success and save nothing.
  if (str(formData, HONEYPOT).length > 0) return { ok: true };

  const values = readValues(formData);

  if (!slugSchema.safeParse(slug).success) {
    return { status: 404, formError: "This page no longer exists.", values };
  }

  const space = await db.space.findUnique({
    where: { slug },
    select: { id: true, collectRating: true, fields: true },
  });
  if (!space) return { status: 404, formError: "This page no longer exists.", values };

  const fieldsParsed = spaceFieldsSchema.safeParse(space.fields);
  if (!fieldsParsed.success) {
    return { status: 500, formError: "Something went wrong. Please try again later.", values };
  }

  // The field config always comes from the database, never from the client.
  const ratingRaw = values.rating as string;
  const parsed = buildTestimonialSchema(fieldsParsed.data, space.collectRating).safeParse({
    name: values.name,
    email: values.email,
    company: values.company,
    socialLink: values.socialLink,
    text: values.text,
    rating: ratingRaw === "" ? undefined : Number(ratingRaw),
    consentToShare: values.consentToShare,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const ip = await clientIp();
  // Three independent windows (CLAUDE.md rule 8): per IP per space (5/h, the spec),
  // per IP across all spaces, and per space across all IPs.
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const allowed = checkRateLimits(submissionStore, now, [
    { key: `ip-space:${space.id}:${ip}`, window: SUBMISSION_LIMIT },
    { key: `ip:${ip}`, window: { max: 20, windowMs: hour } },
    { key: `space:${space.id}`, window: { max: 60, windowMs: hour } },
  ]);
  if (!allowed) {
    return {
      status: 429,
      formError: "You've sent a few testimonials already. Please try again in a while. Your text is still here.",
      values,
    };
  }

  const data = parsed.data as {
    name: string;
    email: string;
    text: string;
    consentToShare: boolean;
    company?: string;
    socialLink?: string;
    rating?: number;
  };

  try {
    const result = await db.$transaction(async (tx) => {
      // Lock the space so concurrent submissions cannot slip past the limit together.
      await tx.$queryRaw`SELECT id FROM "Space" WHERE id = ${space.id} FOR UPDATE`;
      const fresh = await tx.space.findUnique({
        where: { id: space.id },
        select: { owner: { select: { plan: true } } },
      });
      if (!fresh) return "missing" as const;
      const count = await tx.testimonial.count({ where: { spaceId: space.id } });
      if (!canAcceptTestimonial(fresh.owner.plan, count)) return "full" as const;
      await tx.testimonial.create({
        data: {
          spaceId: space.id,
          name: data.name,
          email: data.email,
          text: data.text,
          consentToShare: data.consentToShare,
          rating: space.collectRating ? (data.rating ?? null) : null,
          company: data.company || null,
          socialLink: data.socialLink || null,
        },
      });
      return "ok" as const;
    });
    if (result === "missing") return { status: 404, formError: "This page no longer exists.", values };
    if (result === "full") return { status: 409, closed: true, formError: CLOSED_MESSAGE, values };
  } catch {
    return { status: 500, formError: "Could not send your testimonial. Please try again. Your text is still here.", values };
  }

  return { ok: true };
}
