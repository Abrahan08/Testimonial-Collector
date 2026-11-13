import type { PlanKey } from "@/lib/plans";

// The app name shown in the dashboard header.
export const APP_NAME = "Testimonial Collector";

// PRD 2: the Free plan shows a "Powered by" badge on the public page and in the embed;
// Pro removes it. `plan` must be the space owner's plan read from the database.
export function shouldShowPoweredBy(plan: PlanKey): boolean {
  return plan === "free";
}
