import { z } from "zod";

export const TESTIMONIAL_TEXT_MAX = 1000;

export type SubmissionField = { key: string; enabled: boolean; required: boolean };

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// Optional text input: empty string means "not provided".
function optionalText(label: string, required: boolean, extra: (s: z.ZodString) => z.ZodType<string>) {
  const base = z.string().trim();
  if (required) return extra(base.min(1, `${label} is required`));
  return z.union([z.literal(""), extra(base)]).optional();
}

// Builds the submission schema from the space's own config, server side. Fields that are
// disabled are not in the schema at all, so values sent for them are stripped. `photo` is
// not handled yet. Rating is governed by `collectRating`, not by `fields`.
export function buildTestimonialSchema(fields: readonly SubmissionField[], collectRating: boolean) {
  const cfg = (key: string) => fields.find((f) => f.key === key);
  const company = cfg("company");
  const social = cfg("socialLink");

  const shape: Record<string, z.ZodType> = {
    name: z.string().trim().min(1, "Name is required").max(100, "Max 100 characters"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(254),
    text: z
      .string()
      .trim()
      .min(1, "Please write your testimonial")
      .max(TESTIMONIAL_TEXT_MAX, `Max ${TESTIMONIAL_TEXT_MAX} characters`),
    consentToShare: z.boolean().default(false),
  };

  if (company?.enabled) {
    shape.company = optionalText("Company", company.required, (s) => s.max(100, "Max 100 characters"));
  }
  if (social?.enabled) {
    shape.socialLink = optionalText("Social link", social.required, (s) =>
      s.max(500, "Max 500 characters").refine(isHttpUrl, "Enter a link starting with http:// or https://"),
    );
  }
  if (collectRating) {
    shape.rating = z
      .number({ error: "Please choose a rating" })
      .int("Please choose a rating")
      .min(1, "Please choose a rating")
      .max(5, "Please choose a rating");
  }

  return z.object(shape);
}

export type TestimonialInput = {
  name: string;
  email: string;
  text: string;
  consentToShare: boolean;
  company?: string;
  socialLink?: string;
  rating?: number;
};
