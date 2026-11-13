"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { applyCancel, applyUpgrade } from "@/lib/billing";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

// DEMO BILLING: these actions write User.plan directly, replacing the Stripe webhook
// (docs/data-model.md says only the webhook writes it). Neither action accepts any
// argument: the user comes from the session, and the plan/status/period are fixed here.

export async function upgradeToPro(): Promise<void> {
  const user = await requireUser();
  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true },
  });
  if (!current) redirect("/login");

  const next = applyUpgrade(current, new Date());
  if (next) {
    await db.user.update({ where: { id: user.id }, data: next });
    revalidatePath("/dashboard", "layout");
  }
  redirect("/dashboard/billing?success=1");
}

export async function cancelSubscription(): Promise<void> {
  const user = await requireUser();
  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true },
  });
  if (!current) redirect("/login");

  const next = applyCancel(current);
  if (next) {
    await db.user.update({ where: { id: user.id }, data: next });
    revalidatePath("/dashboard", "layout");
  }
  redirect("/dashboard/billing");
}
