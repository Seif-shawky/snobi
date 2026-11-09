// "Donations" are Snobi's own unit, not pounds: each order turns its clothing price into donations
// with a multiplier that grows with how many items are in that one order, so bundles count for
// more. Each order's donations are stored when it's placed, so changing these rates later never
// rewrites past orders.

export const BASE_MULTIPLIER = 1.2;
export const MULTIPLIER_STEP = 0.2;
export const MAX_MULTIPLIER = 2;

// 1 item ×1.2, 2 items ×1.4, 3 ×1.6, 4 ×1.8, 5 or more ×2.
export function donationMultiplier(itemCount: number) {
  if (itemCount < 1) return 0;
  const steps = Math.min(itemCount - 1, (MAX_MULTIPLIER - BASE_MULTIPLIER) / MULTIPLIER_STEP);
  // Rounded to one decimal so 1.2 + 0.2 + 0.2 never drifts to 1.5999…
  return Math.round((BASE_MULTIPLIER + steps * MULTIPLIER_STEP) * 10) / 10;
}

// Donations for an order: clothing price in pounds (no delivery fee) times the multiplier.
export function donationsForOrder(subtotalCents: number, itemCount: number) {
  return Math.round((subtotalCents / 100) * donationMultiplier(itemCount));
}

export function formatDonations(donations: number, ar: boolean) {
  return donations.toLocaleString(ar ? "ar-EG" : "en-US");
}
