import { describe, expect, it } from "vitest";
import { editTestimonialSchema, inboxQuerySchema } from "./inbox";

const base = { id: "t1", name: "Ava", text: "Great", rating: 5 };

describe("editTestimonialSchema", () => {
  it("accepts valid input and trims", () => {
    const r = editTestimonialSchema.parse({ ...base, name: "  Ava  ", text: "  Great  " });
    expect(r.name).toBe("Ava");
    expect(r.text).toBe("Great");
  });

  it("rejects empty or whitespace name and text", () => {
    expect(editTestimonialSchema.safeParse({ ...base, name: "   " }).success).toBe(false);
    expect(editTestimonialSchema.safeParse({ ...base, text: "" }).success).toBe(false);
  });

  it("enforces length bounds", () => {
    expect(editTestimonialSchema.safeParse({ ...base, name: "a".repeat(100) }).success).toBe(true);
    expect(editTestimonialSchema.safeParse({ ...base, name: "a".repeat(101) }).success).toBe(false);
    expect(editTestimonialSchema.safeParse({ ...base, text: "a".repeat(1000) }).success).toBe(true);
    expect(editTestimonialSchema.safeParse({ ...base, text: "a".repeat(1001) }).success).toBe(false);
  });

  it("enforces rating 1 to 5, integer, optional", () => {
    for (const rating of [0, 6, 2.5, -1]) {
      expect(editTestimonialSchema.safeParse({ ...base, rating }).success).toBe(false);
    }
    expect(editTestimonialSchema.safeParse({ ...base, rating: 1 }).success).toBe(true);
    expect(editTestimonialSchema.safeParse({ id: "t1", name: "A", text: "b" }).success).toBe(true);
    expect(editTestimonialSchema.safeParse({ ...base, rating: null }).success).toBe(true);
  });

  it("strips an email sent by the client", () => {
    const r = editTestimonialSchema.parse({ ...base, email: "x@y.com" });
    expect("email" in r).toBe(false);
  });
});

describe("inboxQuerySchema", () => {
  it("applies defaults", () => {
    expect(inboxQuerySchema.parse({})).toEqual({ space: undefined, status: "all", q: "", page: 1 });
  });

  it("falls back on invalid values", () => {
    const r = inboxQuerySchema.parse({ status: "bogus", page: "-3", q: "  hi  " });
    expect(r.status).toBe("all");
    expect(r.page).toBe(1);
    expect(r.q).toBe("hi");
    expect(inboxQuerySchema.parse({ page: "abc" }).page).toBe(1);
    expect(inboxQuerySchema.parse({ page: "3", status: "hidden" })).toMatchObject({ page: 3, status: "hidden" });
  });
});
