import { describe, expect, it } from "vitest";
import { checkRateLimit, checkRateLimits, type RateLimitStore } from "./rate-limit";

describe("checkRateLimits", () => {
  it("a blocked request does not consume the other windows", () => {
    const store: RateLimitStore = new Map();
    const w = (max: number) => ({ max, windowMs: 3_600_000 });
    expect(checkRateLimits(store, 0, [{ key: "a", window: w(1) }, { key: "shared", window: w(10) }])).toBe(true);
    expect(checkRateLimits(store, 1, [{ key: "a", window: w(1) }, { key: "shared", window: w(10) }])).toBe(false);
    expect(store.get("shared")).toHaveLength(1);
  });
  it("evicts oldest keys past the hard cap", () => {
    const store: RateLimitStore = new Map();
    for (let i = 0; i < 12000; i++) store.set(`k${i}`, [0]);
    checkRateLimit(store, "new", 1, { max: 5, windowMs: 3_600_000 });
    expect(store.size).toBeLessThanOrEqual(10001);
    expect(store.has("new")).toBe(true);
  });
});

const opts = { max: 5, windowMs: 3_600_000 };

describe("checkRateLimit", () => {
  it("allows 5 then blocks the 6th", () => {
    const store: RateLimitStore = new Map();
    for (let i = 0; i < 5; i++) expect(checkRateLimit(store, "s:ip", 1000 + i, opts).allowed).toBe(true);
    expect(checkRateLimit(store, "s:ip", 2000, opts)).toEqual({ allowed: false, remaining: 0 });
  });
  it("reports remaining", () => {
    const store: RateLimitStore = new Map();
    expect(checkRateLimit(store, "k", 0, opts).remaining).toBe(4);
    expect(checkRateLimit(store, "k", 1, opts).remaining).toBe(3);
  });
  it("keys are independent (per IP and per space)", () => {
    const store: RateLimitStore = new Map();
    for (let i = 0; i < 5; i++) checkRateLimit(store, "a:1.1.1.1", i, opts);
    expect(checkRateLimit(store, "a:1.1.1.1", 10, opts).allowed).toBe(false);
    expect(checkRateLimit(store, "a:2.2.2.2", 10, opts).allowed).toBe(true);
    expect(checkRateLimit(store, "b:1.1.1.1", 10, opts).allowed).toBe(true);
  });
  it("recovers after the window passes", () => {
    const store: RateLimitStore = new Map();
    for (let i = 0; i < 5; i++) checkRateLimit(store, "k", 0, opts);
    expect(checkRateLimit(store, "k", opts.windowMs - 1, opts).allowed).toBe(false);
    expect(checkRateLimit(store, "k", opts.windowMs, opts).allowed).toBe(true);
  });
  it("blocked attempts do not extend the block", () => {
    const store: RateLimitStore = new Map();
    for (let i = 0; i < 5; i++) checkRateLimit(store, "k", 0, opts);
    checkRateLimit(store, "k", opts.windowMs - 1, opts);
    expect(checkRateLimit(store, "k", opts.windowMs, opts).allowed).toBe(true);
  });
});
