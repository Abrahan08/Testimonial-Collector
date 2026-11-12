import { z } from "zod";
import { TESTIMONIAL_TEXT_MAX } from "@/lib/validators/testimonial";

export const INBOX_STATUSES = ["all", "favorites", "wall", "hidden"] as const;
export type InboxStatus = (typeof INBOX_STATUSES)[number];

export const PAGE_SIZE = 20;

// Ids come from the client, so they are only ever used together with an owner-scoped where.
export const idSchema = z.string().trim().min(1).max(64);

export const editTestimonialSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
  text: z
    .string()
    .trim()
    .min(1, "Text is required")
    .max(TESTIMONIAL_TEXT_MAX, `Max ${TESTIMONIAL_TEXT_MAX} characters`),
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating is 1 to 5")
    .max(5, "Rating is 1 to 5")
    .nullable()
    .optional(),
});
export type EditTestimonialInput = z.input<typeof editTestimonialSchema>;

export const setFlagSchema = z.object({ id: idSchema, value: z.boolean() });

// Query params are untrusted; anything invalid falls back to a default.
export const inboxQuerySchema = z.object({
  space: z.string().trim().max(64).optional().catch(undefined),
  status: z.enum(INBOX_STATUSES).catch("all"),
  q: z.string().trim().max(100).catch("").default(""),
  page: z.coerce.number().int().min(1).max(100000).catch(1).default(1),
});
export type InboxQuery = z.infer<typeof inboxQuerySchema>;
