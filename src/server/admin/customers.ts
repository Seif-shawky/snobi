import { desc, eq, or, sql } from "drizzle-orm";
import { displayNameSchema, snobiImageUrl, titleSchema } from "@/lib/account-rules";
import {
  customerSearch,
  generateTempPassword,
  moderationMessage,
} from "@/lib/admin-customer-rules";
import type { FieldErrors } from "@/lib/admin-shared";
import { DONATION_STATUSES } from "@/lib/community-rules";
import { hashPassword } from "../account/crypto";
import { getDb } from "../db/client";
import { loginAttempts, orders, snobiOptions, userWornItems, users } from "../db/schema";
import { requireAdmin } from "./auth";

const LIST_LIMIT = 200;
const GONE = "This account no longer exists.";

export type CustomerActionResult = { ok: true } | { ok: false; error: string };
export type CustomerEditResult = { ok: true } | { ok: false; fieldErrors: FieldErrors };
export type PasswordResetResult = { ok: true; tempPassword: string } | { ok: false; error: string };

// Drizzle renders columns unqualified inside sql``, so the correlated subquery is spelled out.
const donatedCents = sql<number>`coalesce((select sum(o.subtotal_cents) from orders o where o.user_id = "users"."id" and o.status in (${sql.join(
  DONATION_STATUSES.map((status) => sql`${status}`),
  sql`, `,
)})), 0)`;

const summaryColumns = {
  id: users.id,
  phone: users.phone,
  displayName: users.displayName,
  title: users.title,
  isPublic: users.isPublic,
  hiddenByAdmin: users.hiddenByAdmin,
  createdAt: users.createdAt,
  imageKey: snobiOptions.imageKey,
  donatedCents,
};

export async function adminListCustomers(rawQuery: string) {
  await requireAdmin();
  const search = customerSearch(rawQuery);
  const rows = await getDb()
    .select(summaryColumns)
    .from(users)
    .innerJoin(snobiOptions, eq(users.snobiOptionId, snobiOptions.id))
    .where(
      search
        ? or(
            sql`${users.displayName} like ${search.name} escape '\\'`,
            search.digits ? sql`${users.phone} like ${search.digits} escape '\\'` : undefined,
          )
        : undefined,
    )
    .orderBy(desc(users.createdAt))
    .limit(LIST_LIMIT + 1);
  return {
    customers: rows
      .slice(0, LIST_LIMIT)
      .map(({ imageKey, ...row }) => ({ ...row, imageUrl: snobiImageUrl(imageKey) })),
    truncated: rows.length > LIST_LIMIT,
  };
}

export async function adminGetCustomer(id: string) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select(summaryColumns)
    .from(users)
    .innerJoin(snobiOptions, eq(users.snobiOptionId, snobiOptions.id))
    .where(eq(users.id, id));
  if (!row) return null;
  const customerOrders = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      status: orders.status,
      subtotalCents: orders.subtotalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, id))
    .orderBy(desc(orders.createdAt));
  const { imageKey, ...customer } = row;
  return { customer: { ...customer, imageUrl: snobiImageUrl(imageKey) }, orders: customerOrders };
}

export async function adminSetCustomerHidden(
  id: string,
  hidden: boolean,
): Promise<CustomerActionResult> {
  await requireAdmin();
  const updated = await getDb()
    .update(users)
    .set({ hiddenByAdmin: hidden, updatedAt: Date.now() })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return updated.length ? { ok: true } : { ok: false, error: GONE };
}

export async function adminUpdateCustomer(
  id: string,
  displayName: string,
  title: string,
): Promise<CustomerEditResult> {
  await requireAdmin();
  const name = displayNameSchema.safeParse(displayName);
  const cleanTitle = titleSchema.safeParse(title.trim());
  if (!name.success || !cleanTitle.success) {
    const fieldErrors: FieldErrors = {};
    if (!name.success) {
      fieldErrors["displayName"] = moderationMessage(name.error.issues[0]?.message ?? "");
    }
    if (!cleanTitle.success) {
      fieldErrors["title"] = moderationMessage(cleanTitle.error.issues[0]?.message ?? "");
    }
    return { ok: false, fieldErrors };
  }
  const updated = await getDb()
    .update(users)
    .set({ displayName: name.data, title: cleanTitle.data, updatedAt: Date.now() })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return updated.length ? { ok: true } : { ok: false, fieldErrors: { form: GONE } };
}

// How customers recover a forgotten password: the owner sends them the one-time result.
export async function adminResetCustomerPassword(id: string): Promise<PasswordResetResult> {
  await requireAdmin();
  const db = getDb();
  const [user] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, id));
  if (!user) return { ok: false, error: GONE };
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  await db.batch([
    db
      .update(users)
      .set({
        passwordHash,
        // Part of the session signature, so every device gets logged out.
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: Date.now(),
      })
      .where(eq(users.id, id)),
    // Someone who forgot their password has often locked the number by guessing; see loginUser.
    db.delete(loginAttempts).where(eq(loginAttempts.ip, `phone:${user.phone}`)),
  ]);
  return { ok: true, tempPassword };
}

export async function adminDeleteCustomer(id: string): Promise<CustomerActionResult> {
  await requireAdmin();
  const db = getDb();
  // Spelled out in one batch: orders stay, without the account, however the foreign keys behave.
  await db.batch([
    db.update(orders).set({ userId: null }).where(eq(orders.userId, id)),
    db.delete(userWornItems).where(eq(userWornItems.userId, id)),
    db.delete(users).where(eq(users.id, id)),
  ]);
  return { ok: true };
}
