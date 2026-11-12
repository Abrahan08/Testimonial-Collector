import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

async function LoginGate() {
  if (await getSession()) redirect("/dashboard");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginGate />
      </Suspense>
    </main>
  );
}
