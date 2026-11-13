import { describe, expect, it } from "vitest";
import { BILLING_PERIOD_DAYS, PLAN_COMPARISON, applyCancel, applyUpgrade, type BillingState } from "@/lib/billing";
import { PLAN_LIMITS } from "@/lib/plans";

const now = new Date("2026-01-01T00:00:00.000Z");
const free: BillingState = { plan: "free", subscriptionStatus: null, currentPeriodEnd: null };
const pro: BillingState = {
  plan: "pro",
  subscriptionStatus: "active",
  currentPeriodEnd: new Date("2026-01-20T00:00:00.000Z"),
};

describe("applyUpgrade", () => {
  it("moves free to pro/active with a period end 30 days out", () => {
    const next = applyUpgrade(free, now);
    expect(next).toEqual({
      plan: "pro",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date("2026-01-31T00:00:00.000Z"),
    });
    expect(BILLING_PERIOD_DAYS).toBe(30);
  });

  it("is idempotent when already pro and active", () => {
    expect(applyUpgrade(pro, now)).toBeNull();
  });

  it("re-activates a pro row that is not active", () => {
    expect(applyUpgrade({ ...pro, subscriptionStatus: "canceled" }, now)?.subscriptionStatus).toBe("active");
  });

  it("re-upgrades after a cancel", () => {
    const canceled = applyCancel(pro)!;
    expect(applyUpgrade(canceled, now)?.plan).toBe("pro");
  });
});

describe("applyCancel", () => {
  it("moves pro to free/canceled immediately and clears the period end", () => {
    expect(applyCancel(pro)).toEqual({ plan: "free", subscriptionStatus: "canceled", currentPeriodEnd: null });
  });

  it("is a no-op when already free", () => {
    expect(applyCancel(free)).toBeNull();
  });
});

describe("PLAN_COMPARISON", () => {
  it("lists free then pro with PLAN_LIMITS numbers and the Pro price", () => {
    expect(PLAN_COMPARISON.map((p) => p.key)).toEqual(["free", "pro"]);
    const [f, p] = PLAN_COMPARISON;
    expect(f).toMatchObject({ spaces: 3, testimonialsPerSpace: 100, price: "$0" });
    expect(p).toMatchObject({ spaces: 25, testimonialsPerSpace: 1000, price: "$9.99/month" });
    expect(f.spaces).toBe(PLAN_LIMITS.free.spaces);
    expect(p.testimonialsPerSpace).toBe(PLAN_LIMITS.pro.testimonialsPerSpace);
  });
});
