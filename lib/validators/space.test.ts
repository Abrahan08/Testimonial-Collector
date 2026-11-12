import { describe, expect, it } from "vitest";
import { DEFAULT_FIELDS, createSpaceSchema, spaceFieldsSchema, updateSpaceSchema } from "./space";

type F = { key: string; enabled: boolean; required: boolean };
const fields = (): F[] => DEFAULT_FIELDS.map((f) => ({ ...f }));
const valid = () => ({
  name: "My space",
  title: "Share your story",
  subtitle: "",
  ask: "What do you think?",
  collectRating: true,
  theme: "light" as const,
  fields: fields(),
});

describe("spaceFieldsSchema", () => {
  it("accepts the default fields", () => {
    expect(spaceFieldsSchema.safeParse(fields()).success).toBe(true);
  });

  it("rejects required without enabled", () => {
    const f = fields();
    f[2] = { key: "company", enabled: false, required: true };
    expect(spaceFieldsSchema.safeParse(f).success).toBe(false);
  });

  it("rejects unlocking name or email", () => {
    const f = fields();
    f[1] = { key: "email", enabled: true, required: false };
    expect(spaceFieldsSchema.safeParse(f).success).toBe(false);
  });

  it("rejects duplicate or missing keys", () => {
    const f = fields();
    f[4] = { key: "company", enabled: false, required: false };
    expect(spaceFieldsSchema.safeParse(f).success).toBe(false);
    expect(spaceFieldsSchema.safeParse(fields().slice(0, 4)).success).toBe(false);
  });

  it("accepts optional fields enabled and required", () => {
    const f = fields();
    f[3] = { key: "socialLink", enabled: true, required: true };
    expect(spaceFieldsSchema.safeParse(f).success).toBe(true);
  });
});

describe("createSpaceSchema", () => {
  it("accepts valid input and trims", () => {
    const r = createSpaceSchema.safeParse({ ...valid(), name: "  Hi  " });
    expect(r.success && r.data.name).toBe("Hi");
  });

  it("rejects empty name, title and ask", () => {
    for (const key of ["name", "title", "ask"] as const) {
      expect(createSpaceSchema.safeParse({ ...valid(), [key]: "   " }).success).toBe(false);
    }
  });

  it("rejects unknown theme and too-long name", () => {
    expect(createSpaceSchema.safeParse({ ...valid(), theme: "neon" }).success).toBe(false);
    expect(createSpaceSchema.safeParse({ ...valid(), name: "a".repeat(81) }).success).toBe(false);
  });
});

describe("updateSpaceSchema", () => {
  it("accepts valid input and trims", () => {
    const r = updateSpaceSchema.safeParse({ ...valid(), title: "  Hello  " });
    expect(r.success && r.data.title).toBe("Hello");
  });

  it("rejects empty name, title and ask", () => {
    for (const key of ["name", "title", "ask"] as const) {
      expect(updateSpaceSchema.safeParse({ ...valid(), [key]: "   " }).success).toBe(false);
    }
  });

  it("rejects unknown theme and unlocked name or email", () => {
    expect(updateSpaceSchema.safeParse({ ...valid(), theme: "neon" }).success).toBe(false);
    const f = fields();
    f[0] = { key: "name", enabled: true, required: false };
    expect(updateSpaceSchema.safeParse({ ...valid(), fields: f }).success).toBe(false);
  });

  it("rejects slug and ownerId (immutable)", () => {
    expect(updateSpaceSchema.safeParse({ ...valid(), slug: "other" }).success).toBe(false);
    expect(updateSpaceSchema.safeParse({ ...valid(), ownerId: "someone-else" }).success).toBe(false);
  });
});
