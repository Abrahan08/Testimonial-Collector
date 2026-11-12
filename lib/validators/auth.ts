import { z } from "zod";

// Shared by the signup/login server actions (PRD 5.1: min password 8).
export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, "Password is too long"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
