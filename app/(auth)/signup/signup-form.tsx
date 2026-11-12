"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type FormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: FormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const errors = state.fieldErrors ?? {};

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start collecting testimonials.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" defaultValue={state.values?.name} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} />
            {errors.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
          </div>
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating account..." : "Sign up"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
