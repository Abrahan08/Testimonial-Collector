import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const transaction = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    space: { findUnique: (...a: unknown[]) => findUnique(...a) },
    $transaction: (...a: unknown[]) => transaction(...a),
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));

import { submitTestimonialAction } from "./actions";

function form(extra: Record<string, string> = {}) {
  const fd = new FormData();
  const base: Record<string, string> = {
    name: "Ada",
    email: "ada@example.com",
    text: "Great product",
    consentToShare: "on",
    ...extra,
  };
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

describe("submitTestimonialAction honeypot", () => {
  beforeEach(() => {
    findUnique.mockReset();
    transaction.mockReset();
  });

  it("pretends success and touches nothing when the honeypot is filled", async () => {
    const result = await submitTestimonialAction("my-space", {}, form({ hp_website: "http://spam.example" }));
    expect(result).toEqual({ ok: true });
    expect(findUnique).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("continues to the space lookup when the honeypot is empty (control)", async () => {
    findUnique.mockResolvedValue(null);
    const result = await submitTestimonialAction("my-space", {}, form({ hp_website: "" }));
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(404);
  });
});
