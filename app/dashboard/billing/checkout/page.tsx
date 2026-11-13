import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { CheckoutForm } from "./checkout-form";

async function Checkout() {
  const user = await requireUser();
  const owner = await db.user.findUnique({ where: { id: user.id }, select: { plan: true } });
  if (owner?.plan === "pro") redirect("/dashboard/billing");
  return <CheckoutForm />;
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <Suspense fallback={null}>
        <Checkout />
      </Suspense>
    </main>
  );
}
