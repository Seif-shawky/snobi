import { describe, expect, it } from "vitest";
import { donationMultiplier, donationsForOrder, MAX_MULTIPLIER } from "@/lib/donations";
import { NEXT_PHASE_GOAL_DONATIONS } from "@/lib/phase";

describe("donations", () => {
  it("raises the multiplier per item in one order, capped at 2", () => {
    expect([1, 2, 3, 4, 5, 6, 20].map(donationMultiplier)).toEqual([1.2, 1.4, 1.6, 1.8, 2, 2, 2]);
    expect(donationMultiplier(0)).toBe(0);
    expect(donationMultiplier(99)).toBe(MAX_MULTIPLIER);
  });

  it("matches the owner's jacket example: one order of two beats two orders of one", () => {
    expect(donationsForOrder(100_000, 1)).toBe(1_200);
    expect(donationsForOrder(200_000, 2)).toBe(2_800);
    expect(donationsForOrder(200_000, 2)).toBeGreaterThan(2 * donationsForOrder(100_000, 1));
  });

  it("works in pounds and rounds to whole donations", () => {
    expect(donationsForOrder(45_050, 1)).toBe(541); // EGP 450.50 × 1.2 = 540.6
    expect(donationsForOrder(0, 1)).toBe(0);
  });

  it("keeps a first goal reachable at launch: about 30–40 shirts", () => {
    const shirt = donationsForOrder(75_000, 1);
    const shirts = NEXT_PHASE_GOAL_DONATIONS / shirt;
    expect(shirts).toBeGreaterThan(25);
    expect(shirts).toBeLessThan(45);
  });
});
