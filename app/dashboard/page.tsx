import { Suspense } from "react";
import { requireUser } from "@/lib/session";

async function Welcome() {
  const user = await requireUser();
  return <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>;
}

export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <Welcome />
      </Suspense>
    </main>
  );
}
