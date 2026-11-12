import { describe, expect, it } from "vitest";
import { buildTestimonialSchema, type SubmissionField } from "./testimonial";

const fields = (over: Partial<Record<string, { enabled: boolean; required: boolean }>> = {}): SubmissionField[] =>
  ["name", "email", "company", "socialLink", "photo"].map((key) => ({
    key,
    ...(over[key] ?? (key === "name" || key === "email" ? { enabled: true, required: true } : { enabled: false, required: false })),
  }));

const base = { name: "Ada", email: "ada@example.com", text: "Great!", consentToShare: false };

describe("buildTestimonialSchema", () => {
  it("accepts a minimal valid submission and defaults consent to false", () => {
    const r = buildTestimonialSchema(fields(), false).safeParse({ name: "Ada", email: "ada@example.com", text: "Hi" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.consentToShare).toBe(false);
  });

  it("requires name, email and text", () => {
    const r = buildTestimonialSchema(fields(), false).safeParse({ name: " ", email: "", text: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const keys = Object.keys(r.error.flatten().fieldErrors);
      expect(keys).toEqual(expect.arrayContaining(["name", "email", "text"]));
    }
  });

  it("rejects invalid email and over-long name", () => {
    const s = buildTestimonialSchema(fields(), false);
    expect(s.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(s.safeParse({ ...base, name: "a".repeat(101) }).success).toBe(false);
    expect(s.safeParse({ ...base, name: "a".repeat(100) }).success).toBe(true);
  });

  it("text length: 1 to 1000 characters", () => {
    const s = buildTestimonialSchema(fields(), false);
    expect(s.safeParse({ ...base, text: "a".repeat(1000) }).success).toBe(true);
    expect(s.safeParse({ ...base, text: "a".repeat(1001) }).success).toBe(false);
    expect(s.safeParse({ ...base, text: "   " }).success).toBe(false);
  });

  it("company: ignored when disabled, optional or required when enabled, max 100", () => {
    const off = buildTestimonialSchema(fields(), false).safeParse({ ...base, company: "Acme" });
    expect(off.success && "company" in off.data).toBe(false);

    const opt = buildTestimonialSchema(fields({ company: { enabled: true, required: false } }), false);
    expect(opt.safeParse({ ...base }).success).toBe(true);
    expect(opt.safeParse({ ...base, company: "" }).success).toBe(true);
    expect(opt.safeParse({ ...base, company: "a".repeat(101) }).success).toBe(false);

    const req = buildTestimonialSchema(fields({ company: { enabled: true, required: true } }), false);
    expect(req.safeParse({ ...base }).success).toBe(false);
    expect(req.safeParse({ ...base, company: "" }).success).toBe(false);
    expect(req.safeParse({ ...base, company: "Acme" }).success).toBe(true);
  });

  it("social link must be http or https", () => {
    const s = buildTestimonialSchema(fields({ socialLink: { enabled: true, required: true } }), false);
    expect(s.safeParse({ ...base, socialLink: "https://x.com/ada" }).success).toBe(true);
    expect(s.safeParse({ ...base, socialLink: "http://x.com/ada" }).success).toBe(true);
    expect(s.safeParse({ ...base, socialLink: "javascript:alert(1)" }).success).toBe(false);
    expect(s.safeParse({ ...base, socialLink: "ftp://x.com" }).success).toBe(false);
    expect(s.safeParse({ ...base, socialLink: "data:text/html,hi" }).success).toBe(false);
    expect(s.safeParse({ ...base, socialLink: "not a url" }).success).toBe(false);
    expect(s.safeParse({ ...base }).success).toBe(false);
  });

  it("optional social link still rejects bad protocols when filled", () => {
    const s = buildTestimonialSchema(fields({ socialLink: { enabled: true, required: false } }), false);
    expect(s.safeParse({ ...base, socialLink: "" }).success).toBe(true);
    expect(s.safeParse({ ...base, socialLink: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rating: required 1-5 integer only when collectRating is on", () => {
    const on = buildTestimonialSchema(fields(), true);
    expect(on.safeParse({ ...base }).success).toBe(false);
    expect(on.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(on.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(on.safeParse({ ...base, rating: 2.5 }).success).toBe(false);
    expect(on.safeParse({ ...base, rating: 5 }).success).toBe(true);

    const off = buildTestimonialSchema(fields(), false).safeParse({ ...base, rating: 5 });
    expect(off.success && "rating" in off.data).toBe(false);
  });

  it("photo and unknown keys are stripped", () => {
    const r = buildTestimonialSchema(fields({ photo: { enabled: true, required: true } }), false).safeParse({
      ...base,
      photo: "x",
      ownerId: "evil",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(Object.keys(r.data).sort()).toEqual(["consentToShare", "email", "name", "text"]);
  });
});
