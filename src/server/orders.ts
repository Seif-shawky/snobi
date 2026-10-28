import { eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { OrderView } from "@/lib/cart-types";
import type { PlaceOrderInput, PlaceOrderResult } from "@/lib/order-schema";
import { loadVariantRows } from "./cart";
import { getDb } from "./db/client";
import { orderItems, orders, variants } from "./db/schema";
import { constantTimeEqual, generateAccessToken, generateReference } from "./order-codes";
import { mergeLines, priceOrder } from "./pricing";

// Walks an error and its causes (Drizzle wraps D1 errors) into one searchable string.
function errorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" | ");
}

async function findByIdempotencyKey(key: string) {
  const [existing] = await getDb()
    .select({ reference: orders.reference, accessToken: orders.accessToken })
    .from(orders)
    .where(eq(orders.idempotencyKey, key))
    .limit(1);
  return existing;
}

// Creates a cash-on-delivery order. Stock is decremented in the same atomic D1 batch as the
// order insert; the variants_stock_nonnegative CHECK makes an oversell roll back everything.
// Contract with /admin: cancelling an order restores its stock.
export async function placeOrderServer(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const existing = await findByIdempotencyKey(input.idempotencyKey);
  if (existing) return { ok: true, ...existing };

  const lines = mergeLines(input.lines);
  const priced = priceOrder(lines, await loadVariantRows(lines.map((l) => l.variantId)));
  if (!priced.ok) return priced;

  const db = getDb();
  const { customer } = input;
  const now = Date.now();

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderId = crypto.randomUUID();
    const reference = generateReference();
    const accessToken = generateAccessToken();
    const statements: BatchItem<"sqlite">[] = [
      db.insert(orders).values({
        id: orderId,
        reference,
        accessToken,
        idempotencyKey: input.idempotencyKey,
        status: "pending",
        paymentMethod: "cod",
        customerName: customer.name,
        phone: customer.phone,
        email: customer.email ?? null,
        governorate: customer.governorate,
        city: customer.city,
        addressLine: customer.addressLine,
        notes: customer.notes ?? null,
        subtotalCents: priced.subtotalCents,
        shippingCents: null,
        currency: "EGP",
        createdAt: now,
        updatedAt: now,
      }),
      ...priced.items.map((item) =>
        db.insert(orderItems).values({ id: crypto.randomUUID(), orderId, ...item }),
      ),
      ...priced.items.map((item) =>
        db
          .update(variants)
          // If the size was deactivated, its product hidden, or its price changed since we read
          // it, write -1 so the stock CHECK fails and the whole batch rolls back.
          .set({
            stock: sql`CASE WHEN ${variants.active} = 1
              AND ${variants.priceCents} = ${item.unitPriceCents}
              AND (SELECT status FROM products WHERE products.id = ${variants.productId}) = 'active'
              THEN ${variants.stock} - ${item.quantity} ELSE -1 END`,
            updatedAt: now,
          })
          .where(eq(variants.id, item.variantId)),
      ),
    ];
    try {
      await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
      return { ok: true, reference, accessToken };
    } catch (error) {
      const text = errorText(error);
      if (/CHECK constraint failed|variants_stock_nonnegative/i.test(text)) {
        // Someone else bought the last ones between our read and the batch. Nothing was written.
        const fresh = priceOrder(lines, await loadVariantRows(lines.map((l) => l.variantId)));
        return fresh.ok
          ? { ok: false, error: "out_of_stock", variantIds: [] }
          : { ok: false, error: fresh.error, variantIds: fresh.variantIds };
      }
      if (/UNIQUE constraint failed/i.test(text)) {
        // A concurrent retry with the same key won the race: return that order.
        const raced = await findByIdempotencyKey(input.idempotencyKey);
        if (raced) return { ok: true, ...raced };
        // Otherwise the random reference collided; try again with a new one.
        if (/orders\.reference/i.test(text)) continue;
      }
      throw error;
    }
  }
  throw new Error("Could not allocate a unique order reference");
}

// Returns the order only when the access token matches; null otherwise (no hint which part failed).
export async function getOrderServer(reference: string, token: string): Promise<OrderView | null> {
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  if (!order || !constantTimeEqual(order.accessToken, token)) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return {
    reference: order.reference,
    status: order.status,
    createdAt: order.createdAt,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    governorate: order.governorate,
    city: order.city,
    addressLine: order.addressLine,
    notes: order.notes,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    currency: order.currency,
    items: items.map((i) => ({
      nameEn: i.productNameEn,
      nameAr: i.productNameAr,
      size: i.size,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
      lineTotalCents: i.unitPriceCents * i.quantity,
    })),
  };
}
