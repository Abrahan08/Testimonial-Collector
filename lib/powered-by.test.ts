import { describe, expect, it } from "vitest";
import { APP_NAME, shouldShowPoweredBy } from "./powered-by";

describe("shouldShowPoweredBy", () => {
  it("shows the badge for the free plan", () => {
    expect(shouldShowPoweredBy("free")).toBe(true);
  });
  it("hides the badge for the pro plan", () => {
    expect(shouldShowPoweredBy("pro")).toBe(false);
  });
});

describe("APP_NAME", () => {
  it("matches the name used in the dashboard header", () => {
    expect(APP_NAME).toBe("Testimonial Collector");
  });
});
