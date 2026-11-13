import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";

// Pure check: may an owner on `plan` with `currentSpaceCount` spaces create another?
export function canCreateSpace(plan: PlanKey, currentSpaceCount: number): boolean {
  return currentSpaceCount < PLAN_LIMITS[plan].spaces;
}

// Pure check: may a space owned by someone on `plan` with `currentCount` testimonials accept another?
export function canAcceptTestimonial(plan: PlanKey, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].testimonialsPerSpace;
}

// Pure check: is there a higher plan to move to? Decides whether a limit message links to Billing.
export function canUpgrade(plan: PlanKey): boolean {
  return plan === "free";
}

export const CLOSED_MESSAGE = "This space isn't accepting testimonials right now";
