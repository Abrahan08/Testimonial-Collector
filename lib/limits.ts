import { PLAN_LIMITS, type PlanKey } from "@/lib/plans";

// Pure check: may an owner on `plan` with `currentSpaceCount` spaces create another?
export function canCreateSpace(plan: PlanKey, currentSpaceCount: number): boolean {
  return currentSpaceCount < PLAN_LIMITS[plan].spaces;
}
