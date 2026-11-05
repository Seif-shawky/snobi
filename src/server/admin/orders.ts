import { env } from "cloudflare:workers";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { snobiImageUrl } from "@/lib/account-rules";
import {
  ADMIN_ORDER_STATUSES,
  ORDER_TRANSITIONS,
  canTransitionOrder,
  type AdminOrderStatus,
} from "@/lib/admin-shared";
import { getDb } from "../db/client";
import { orderItems, orders, snobiOptions, users } from "../db/schema";
import { requireAdmin } from "./auth";

export type OrderActionResult = { ok: true } | { ok: false; error: string };

export async function adminListOrders(status: AdminOrderStatus | null) {
  await requireAdmin();
  const db = getDb();
  return db
    .select({
      id: orders.id,
      reference: orders.reference,
      createdAt: orders.createdAt,
      customerName: orders.customerName,
      phone: orders.phone,
      governorate: orders.governorate,
      subtotalCents: orders.subtotalCents,
      shippingCents: orders.shippingCents,
      status: orders.status,
      // Drizzle renders columns unqualified inside sql``, so the correlated subquery is spelled out.
      itemCount: sql<number>`coalesce((select sum(oi.quantity) from order_items oi where oi.order_id = "orders"."id"), 0)`,
    })
    .from(orders)
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(500);
}

export async function adminGetOrder(id: string) {
  await requireAdmin();
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.productNameEn));
  const { accessToken: _token, idempotencyKey: _key, ...rest } = order;
  return { order: rest, items, account: order.userId ? await orderAccount(order.userId) : null };
}

async function orderAccount(userId: string) {
  const [row] = await getDb()
    .select({
      id: users.id,
      displayName: users.displayName,
      imageKey: snobiOptions.imageKey,
    })
    .from(users)
    .innerJoin(snobiOptions, eq(users.snobiOptionId, snobiOptions.id))
    .where(eq(users.id, userId));
  if (!row) return null;
  const { imageKey, ...account } = row;
  return { ...account, imageUrl: snobiImageUrl(imageKey) };
}

export async function adminSetShipping(id: string, shippingCents: number | null) {
  await requireAdmin();
  const db = getDb();
  const updated = await db
    .update(orders)
    .set({ shippingCents, updatedAt: Date.now() })
    .where(
      and(eq(orders.id, id), sql`${orders.status} not in ('delivered', 'cancelled', 'returned')`),
    )
    .returning({ id: orders.id });
  return updated.length
    ? ({ ok: true } as const)
    : ({ ok: false, error: "Delivered, cancelled or returned orders can't be changed" } as const);
}

function sourceStatusesSql(to: "cancelled" | "returned") {
  return ADMIN_ORDER_STATUSES.filter((s) => ORDER_TRANSITIONS[s].includes(to))
    .map((s) => `'${s}'`)
    .join(", ");
}

// Cancels or returns an order, optionally putting its items back into stock.
async function closeOrder(
  id: string,
  to: "cancelled" | "returned",
  restock: boolean,
  now: number,
): Promise<OrderActionResult> {
  const sources = sourceStatusesSql(to);
  // Restore runs first and is guarded by the order still being closable; the status flip
  // follows in the same batch. D1 runs a batch as one transaction and executes writes one at
  // a time, so a second (double-clicked) request sees the order already closed and its
  // restore matches no rows: stock comes back exactly once without relying on changes().
  const restore = env.DB.prepare(
    `UPDATE variants
        SET stock = stock + (SELECT SUM(oi.quantity) FROM order_items oi
                              WHERE oi.order_id = ?1 AND oi.variant_id = variants.id),
            updated_at = ?2
      WHERE id IN (SELECT variant_id FROM order_items
                    WHERE order_id = ?1 AND variant_id IS NOT NULL)
        AND EXISTS (SELECT 1 FROM orders WHERE id = ?1 AND status IN (${sources}))`,
  ).bind(id, now);
  const close = env.DB.prepare(
    `UPDATE orders SET status = ?3, updated_at = ?2
      WHERE id = ?1 AND status IN (${sources})`,
  ).bind(id, now, to);
  const results = await env.DB.batch(restock ? [restore, close] : [close]);
  const result = results[results.length - 1];
  return result?.meta.changes === 1
    ? { ok: true }
    : { ok: false, error: "This order was already changed. Refresh to see its current status." };
}

export async function adminTransitionOrder(
  id: string,
  from: AdminOrderStatus,
  to: AdminOrderStatus,
  restock = false,
): Promise<OrderActionResult> {
  await requireAdmin();
  if (!canTransitionOrder(from, to)) {
    return { ok: false, error: `An order can't go from ${from} to ${to}` };
  }
  const now = Date.now();
  if (to === "cancelled") return closeOrder(id, to, true, now);
  if (to === "returned") return closeOrder(id, to, restock, now);
  const db = getDb();
  const updated = await db
    .update(orders)
    .set({ status: to, updatedAt: now, ...(to === "confirmed" ? { confirmedAt: now } : {}) })
    .where(and(eq(orders.id, id), eq(orders.status, from)))
    .returning({ id: orders.id });
  return updated.length
    ? { ok: true }
    : { ok: false, error: "This order was already changed. Refresh to see its current status." };
}
