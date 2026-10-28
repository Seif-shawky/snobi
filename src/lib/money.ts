// Prices are integer piastres (1 EGP = 100), matching the database.
export function formatMoney(cents: number, ar: boolean, currency = "EGP") {
  return new Intl.NumberFormat(ar ? "ar-EG" : "en-EG", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

// Parses an admin-entered pound amount like "450" or "450.50" into piastres.
export function poundsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(Number(trimmed) * 100);
}
