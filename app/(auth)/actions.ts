"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { loginSchema, signUpSchema } from "@/lib/validators/auth";

export type FormState = {
  fieldErrors?: Partial<Record<"name" | "email" | "password", string[]>>;
  formError?: string;
  // Echoed back so the form keeps what was typed (never the password).
  values?: { name?: string; email?: string };
};

function str(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { name: str(formData, "name"), email: str(formData, "email"), password: str(formData, "password") };
  const values = { name: raw.name, email: raw.email };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  try {
    await auth.api.signUpEmail({ body: parsed.data });
  } catch (error) {
    if (isAPIError(error)) {
      const code = (error.body as { code?: string } | undefined)?.code ?? "";
      if (code.startsWith("USER_ALREADY_EXISTS")) {
        return { fieldErrors: { email: ["An account with this email already exists"] }, values };
      }
    }
    return { formError: "Could not create your account. Please try again.", values };
  }
  redirect("/dashboard");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: str(formData, "email"), password: str(formData, "password") };
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  try {
    await auth.api.signInEmail({ body: parsed.data });
  } catch (error) {
    if (isAPIError(error)) {
      const status = Number(error.statusCode ?? 0);
      // Same message for unknown email and wrong password (no account enumeration).
      if (status === 401 || status === 400) {
        return { formError: "Invalid email or password", values };
      }
    }
    return { formError: "Could not log you in. Please try again.", values };
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
