import { describe, expect, it } from "vitest";
import { canAcceptTestimonial, canCreateSpace, canUpgrade } from "./limits";

describe("canUpgrade", () => {
  it("free can upgrade, pro cannot", () => {
    expect(canUpgrade("free")).toBe(true);
    expect(canUpgrade("pro")).toBe(false);
  });
});

describe("canCreateSpace", () => {
  it("free: allows below 3, blocks at and above 3", () => {
    expect(canCreateSpace("free", 0)).toBe(true);
    expect(canCreateSpace("free", 2)).toBe(true);
    expect(canCreateSpace("free", 3)).toBe(false);
    expect(canCreateSpace("free", 4)).toBe(false);
  });
  it("pro: allows below 25, blocks at 25", () => {
    expect(canCreateSpace("pro", 24)).toBe(true);
    expect(canCreateSpace("pro", 25)).toBe(false);
  });
});

describe("canAcceptTestimonial", () => {
  it("free: allows below 100, blocks at and above 100", () => {
    expect(canAcceptTestimonial("free", 0)).toBe(true);
    expect(canAcceptTestimonial("free", 99)).toBe(true);
    expect(canAcceptTestimonial("free", 100)).toBe(false);
    expect(canAcceptTestimonial("free", 101)).toBe(false);
  });
  it("pro: allows below 1000, blocks at 1000", () => {
    expect(canAcceptTestimonial("pro", 999)).toBe(true);
    expect(canAcceptTestimonial("pro", 1000)).toBe(false);
  });
});
