import { z } from "zod";
import { THEME_KEYS } from "@/lib/themes";

export const FIELD_KEYS = ["name", "email", "company", "socialLink", "photo"] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const DEFAULT_FIELDS = [
  { key: "name", enabled: true, required: true },
  { key: "email", enabled: true, required: true },
  { key: "company", enabled: false, required: false },
  { key: "socialLink", enabled: false, required: false },
  { key: "photo", enabled: false, required: false },
] as const;

const spaceField = z
  .object({
    key: z.enum(FIELD_KEYS),
    enabled: z.boolean(),
    required: z.boolean(),
  })
  .refine((f) => !f.required || f.enabled, "required implies enabled");

// docs/data-model.md section 5
export const spaceFieldsSchema = z
  .array(spaceField)
  .length(FIELD_KEYS.length)
  .refine((arr) => new Set(arr.map((f) => f.key)).size === FIELD_KEYS.length, "each key once")
  .refine(
    (arr) => arr.filter((f) => f.key === "name" || f.key === "email").every((f) => f.enabled && f.required),
    "name and email are locked on",
  );

export const createSpaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Max 80 characters"),
  title: z.string().trim().min(1, "Title is required").max(120, "Max 120 characters"),
  subtitle: z.string().trim().max(200, "Max 200 characters"),
  ask: z.string().trim().min(1, "The ask is required").max(500, "Max 500 characters"),
  collectRating: z.boolean(),
  theme: z.enum(THEME_KEYS),
  fields: spaceFieldsSchema,
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;

export const deleteSpaceSchema = z.object({
  id: z.string().min(1),
  confirmName: z.string(),
});
