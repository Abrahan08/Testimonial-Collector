import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { PASSWORD_MIN_LENGTH } from "@/lib/validators/auth";

const secret = process.env.AUTH_SECRET;
if (!secret) {
  // Fail fast rather than letting Better Auth fall back to a default secret.
  throw new Error("AUTH_SECRET is not set");
}

// AUTH_SECRET and APP_URL are passed in explicitly (Better Auth would
// otherwise look for BETTER_AUTH_SECRET / BETTER_AUTH_URL).
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret,
  baseURL: process.env.APP_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
  },
  // PRD 5.1: httpOnly cookie session, 30 days.
  session: { expiresIn: 60 * 60 * 24 * 30 },
  // Must be the last plugin: sets cookies from server actions.
  plugins: [nextCookies()],
});
