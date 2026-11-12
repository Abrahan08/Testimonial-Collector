import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignUpForm } from "./signup-form";

async function SignUpGate() {
  if (await getSession()) redirect("/dashboard");
  return <SignUpForm />;
}

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={null}>
        <SignUpGate />
      </Suspense>
    </main>
  );
}
