import { describe, expect, it } from "vitest";
import { generateSlug, randomSuffix, slugify } from "./slug";

describe("slugify", () => {
  it("makes kebab-case", () => {
    expect(slugify("  My Cool Space! ")).toBe("my-cool-space");
  });
  it("strips accents", () => {
    expect(slugify("Café Münster")).toBe("cafe-munster");
  });
  it("returns empty for no usable characters", () => {
    expect(slugify("!!!")).toBe("");
  });
  it("truncates long names without trailing dash", () => {
    const s = slugify("a".repeat(39) + " bbbb");
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("generateSlug", () => {
  it("appends the suffix", () => {
    expect(generateSlug("My Space", "abc123")).toBe("my-space-abc123");
  });
  it("falls back to 'space'", () => {
    expect(generateSlug("???", "abc123")).toBe("space-abc123");
  });
  it("uses a random 6 char suffix by default", () => {
    expect(generateSlug("x")).toMatch(/^x-[a-z0-9]{6}$/);
    expect(randomSuffix()).not.toBe(randomSuffix());
  });
});
