// Statuses whose item totals count towards Snobi's public donations total. A cancelled order
// stops counting automatically, and delivery fees are never included.
export const DONATION_STATUSES = ["confirmed", "shipped", "delivered"] as const;

export interface SupporterRow {
  phone: string;
  supporterDisplay: "hidden" | "anonymous" | "named";
  supporterName: string | null;
}

export interface PublicSupporter {
  // Null means anonymous.
  name: string | null;
}

// One entry per customer, from delivered orders sorted newest first: the customer's latest
// choice wins, so opting out on a newer order also removes them. Phones never leave this function.
export function listPublicSupporters(rowsNewestFirst: readonly SupporterRow[]): PublicSupporter[] {
  const seen = new Set<string>();
  const supporters: PublicSupporter[] = [];
  for (const row of rowsNewestFirst) {
    if (seen.has(row.phone)) continue;
    seen.add(row.phone);
    if (row.supporterDisplay === "hidden") continue;
    supporters.push({
      name: row.supporterDisplay === "named" ? row.supporterName : null,
    });
  }
  return supporters;
}
