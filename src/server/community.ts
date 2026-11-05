import { desc, eq, inArray, sql } from "drizzle-orm";
import { DONATION_STATUSES, listPublicSupporters } from "@/lib/community-rules";
import { getDb } from "./db/client";
import { orders } from "./db/schema";

export async function loadDonationTotalCents() {
  const [row] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${orders.subtotalCents}), 0)` })
    .from(orders)
    .where(inArray(orders.status, [...DONATION_STATUSES]));
  return row?.total ?? 0;
}

export async function loadSupporters() {
  const rows = await getDb()
    .select({
      phone: orders.phone,
      supporterDisplay: orders.supporterDisplay,
      supporterName: orders.supporterName,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .orderBy(desc(orders.createdAt))
    .limit(5000);
  return listPublicSupporters(rows);
}
