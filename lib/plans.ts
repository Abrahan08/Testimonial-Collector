// Single source of plan numbers (docs/data-model.md section 6, PRD section 2).
// Nothing here is stored in the database; User.plan is the only persisted plan fact.

export const PLAN_LIMITS = {
  free: { spaces: 3, testimonialsPerSpace: 100 },
  pro: { spaces: 25, testimonialsPerSpace: 1000 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export const TESTIMONIAL_WARNING_RATIO = 0.9; // owner warning at 90% and 100%
export const PRO_PRICE_USD_MONTHLY = 9.99; // display only; Stripe price id comes from env
