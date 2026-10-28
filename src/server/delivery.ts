import { asc, eq } from "drizzle-orm";
import type { PublicDeliveryRate } from "@/lib/delivery-rules";
import { getDb } from "./db/client";
import { deliveryRates } from "./db/schema";

export async function getActiveDeliveryRates(): Promise<PublicDeliveryRate[]> {
  return getDb()
    .select({
      governorate: deliveryRates.governorate,
      feeCents: deliveryRates.feeCents,
      minDays: deliveryRates.minDays,
      maxDays: deliveryRates.maxDays,
    })
    .from(deliveryRates)
    .where(eq(deliveryRates.active, true))
    .orderBy(asc(deliveryRates.governorate));
}

export async function getDeliveryRate(governorate: string) {
  const [rate] = await getDb()
    .select({ feeCents: deliveryRates.feeCents, active: deliveryRates.active })
    .from(deliveryRates)
    .where(eq(deliveryRates.governorate, governorate))
    .limit(1);
  return rate ?? null;
}
