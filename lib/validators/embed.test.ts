import { describe, expect, it } from "vitest";
import {
  EMBED_DEFAULTS,
  embedConfigInputSchema,
  parseEmbedParams,
  resolveEmbedOptions,
} from "@/lib/validators/embed";

describe("parseEmbedParams", () => {
  it("leaves missing params undefined so the saved config can apply", () => {
    expect(parseEmbedParams({})).toEqual({
      style: undefined,
      dark: undefined,
      animation: undefined,
      bg: undefined,
    });
  });

  it("accepts valid values", () => {
    expect(parseEmbedParams({ style: "carousel", dark: "true", animation: "false", bg: "1a2B3c" })).toEqual({
      style: "carousel",
      dark: true,
      animation: false,
      bg: "#1a2B3c",
    });
  });

  it("accepts exactly 3 or 6 hex digits", () => {
    expect(parseEmbedParams({ bg: "fff" }).bg).toBe("#fff");
    expect(parseEmbedParams({ bg: "ffffff" }).bg).toBe("#ffffff");
  });

  it.each(["ff", "ffff", "fffff", "fffffff", "ggg", "#fff", "", "fff;x", "red", " fff"])(
    "falls back to the default bg for %j",
    (bg) => {
      expect(parseEmbedParams({ bg }).bg).toBe(EMBED_DEFAULTS.bg);
    },
  );

  it("falls back to defaults for invalid enums and booleans", () => {
    expect(parseEmbedParams({ style: "grid", dark: "yes", animation: "1" })).toMatchObject({
      style: "masonry",
      dark: false,
      animation: true,
    });
  });

  it("falls back for non-string values", () => {
    expect(parseEmbedParams({ style: ["carousel"], bg: 123 })).toMatchObject({ style: "masonry", bg: "#ffffff" });
  });
});

describe("resolveEmbedOptions", () => {
  const saved = { style: "carousel" as const, darkMode: true, animation: false, backgroundColor: "#112233" };

  it("uses defaults with no params and no saved config", () => {
    expect(resolveEmbedOptions({}, null)).toEqual(EMBED_DEFAULTS);
  });

  it("uses the saved config when params are missing", () => {
    expect(resolveEmbedOptions({}, saved)).toEqual({
      style: "carousel",
      dark: true,
      animation: false,
      bg: "#112233",
    });
  });

  it("lets params override the saved config, including false values", () => {
    expect(resolveEmbedOptions({ dark: false, style: "masonry" }, saved)).toMatchObject({
      dark: false,
      style: "masonry",
      animation: false,
    });
  });

  it("ignores a malformed saved colour", () => {
    expect(resolveEmbedOptions({}, { ...saved, backgroundColor: "red" }).bg).toBe("#ffffff");
  });
});

describe("embedConfigInputSchema", () => {
  const base = {
    spaceId: "abc",
    style: "masonry",
    darkMode: false,
    animation: true,
    backgroundColor: "#ffffff",
    source: "all_visible",
  };

  it("accepts a valid config", () => {
    expect(embedConfigInputSchema.safeParse(base).success).toBe(true);
  });

  it.each(["ffffff", "#ffff", "#gggggg", "#ffffff;", "javascript:1"])("rejects colour %j", (backgroundColor) => {
    expect(embedConfigInputSchema.safeParse({ ...base, backgroundColor }).success).toBe(false);
  });

  it("rejects unknown enums", () => {
    expect(embedConfigInputSchema.safeParse({ ...base, style: "grid" }).success).toBe(false);
    expect(embedConfigInputSchema.safeParse({ ...base, source: "everything" }).success).toBe(false);
  });
});
