import { describe, expect, it } from "vitest";
import { canCreateSpace } from "./limits";

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
