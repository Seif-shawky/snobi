import { eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { DeliveryFormOutput } from "@/lib/delivery-rules";
import { getDb } from "../db/client";
import { deliveryRates } from "../db/schema";
import { requireAdmin } from "./auth";

export async function adminListDeliveryRates() {
  await requireAdmin();
  return getDb().select().from(deliveryRates);
}

export async function adminCountActiveDeliveryRates() {
  await requireAdmin();
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(deliveryRates)
    .where(eq(deliveryRates.active, true));
  return row?.count ?? 0;
}

// Writes only rows that changed, so "last updated" reflects real edits. An inactive row with no
// fee is removed; an inactive row with a fee keeps it for when delivery is switched back on.
export async function adminSaveDeliveryRates(form: DeliveryFormOutput) {
  await requireAdmin();
  const db = getDb();
  const existing = new Map((await db.select().from(deliveryRates)).map((r) => [r.governorate, r]));
  const now = Date.now();
  const statements: BatchItem<"sqlite">[] = [];
  for (const row of form.rows) {
    const current = existing.get(row.governorate);
    if (row.fee === null) {
      if (current) {
        statements.push(
          db.delete(deliveryRates).where(eq(deliveryRates.governorate, row.governorate)),
        );
      }
      continue;
    }
    const values = {
      feeCents: row.fee,
      minDays: row.minDays,
      maxDays: row.maxDays,
      active: row.active,
    };
    if (
      current &&
      current.feeCents === values.feeCents &&
      current.minDays === values.minDays &&
      current.maxDays === values.maxDays &&
      current.active === values.active
    ) {
      continue;
    }
    statements.push(
      db
        .insert(deliveryRates)
        .values({ governorate: row.governorate, ...values, updatedAt: now })
        .onConflictDoUpdate({
          target: deliveryRates.governorate,
          set: { ...values, updatedAt: now },
        }),
    );
  }
  if (statements.length > 0) {
    await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  }
  return { ok: true as const, changed: statements.length };
}
