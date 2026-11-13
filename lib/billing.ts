import { PLAN_LIMITS, PRO_PRICE_USD_MONTHLY, type PlanKey } from "@/lib/plans";

// DEMO BILLING: replaces Stripe. No real payments are made.
export const BILLING_PERIOD_DAYS = 30;

export type BillingState = {
  plan: PlanKey;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Returns the fields to write, or null when nothing should change (already Pro and active).
export function applyUpgrade(current: BillingState, now: Date): BillingState | null {
  if (current.plan === "pro" && current.subscriptionStatus === "active") return null;
  return {
    plan: "pro",
    subscriptionStatus: "active",
    currentPeriodEnd: new Date(now.getTime() + BILLING_PERIOD_DAYS * DAY_MS),
  };
}

// Demo simplification: cancelling drops to Free immediately. The PRD (and real Stripe
// behavior) keeps Pro until the period ends; the demo skips that wait on purpose.
// Returns the fields to write, or null when already Free.
export function applyCancel(current: BillingState): BillingState | null {
  if (current.plan === "free") return null;
  return { plan: "free", subscriptionStatus: "canceled", currentPeriodEnd: null };
}

export const PLAN_COMPARISON = (["free", "pro"] as const).map((key) => ({
  key,
  name: key === "free" ? "Free" : "Pro",
  price: key === "free" ? "$0" : `$${PRO_PRICE_USD_MONTHLY}/month`,
  spaces: PLAN_LIMITS[key].spaces,
  testimonialsPerSpace: PLAN_LIMITS[key].testimonialsPerSpace,
}));
