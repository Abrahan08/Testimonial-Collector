import { APP_NAME } from "@/lib/powered-by";

// Small, unobtrusive badge for the public page. Static text only, no user content.
// Render it only when shouldShowPoweredBy(ownerPlan) is true.
export function PoweredByBadge() {
  return (
    <p data-testid="powered-by" className="mt-4 text-center text-xs text-muted-foreground">
      Powered by {APP_NAME}
    </p>
  );
}
