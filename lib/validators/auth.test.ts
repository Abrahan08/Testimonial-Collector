import { describe, expect, it } from "vitest";
import { loginSchema, signUpSchema } from "@/lib/validators/auth";

const valid = { name: "Ada Lovelace", email: "ada@example.com", password: "12345678" };

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("trims and lowercases the email and trims the name", () => {
    const result = signUpSchema.parse({ ...valid, name: "  Ada  ", email: "  ADA@Example.COM " });
    expect(result.email).toBe("ada@example.com");
    expect(result.name).toBe("Ada");
  });

  it("rejects a 7-character password and accepts 8", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, password: "12345678" }).success).toBe(true);
  });

  it("rejects an over-long password", () => {
    expect(signUpSchema.safeParse({ ...valid, password: "a".repeat(129) }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(signUpSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    expect(signUpSchema.safeParse({ ...valid, name: "a".repeat(101) }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input and normalises the email", () => {
    const result = loginSchema.parse({ email: " ADA@example.com", password: "x" });
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "ada@example.com", password: "" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});
