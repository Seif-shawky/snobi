import { setResponseHeader } from "@tanstack/react-start/server";
import { and, desc, eq } from "drizzle-orm";
import {
  buildWardrobe,
  donatedCents,
  snobiImageUrl,
  type AccountResult,
  type MyAccount,
  type SessionUser,
  type SnobiOption,
  type WardrobeRow,
} from "@/lib/account-rules";
import { loadWornUrls } from "../community";
import { getDb } from "../db/client";
import { orderItems, orders, products, snobiOptions, userWornItems, users } from "../db/schema";
import {
  getCurrentUser,
  hashAndRefresh,
  logoutUser,
  requireUser,
  verifyCurrentPassword,
  type CurrentUser,
} from "./auth";

export type WornResult = { ok: true } | { ok: false; error: "not_wearable" };

// These responses carry the customer's own details: never let a cache keep them.
const noStore = () => setResponseHeader("Cache-Control", "private, no-store");

export async function loadSnobiOptions(): Promise<SnobiOption[]> {
  const rows = await getDb()
    .select()
    .from(snobiOptions)
    .where(eq(snobiOptions.active, true))
    .orderBy(snobiOptions.sortOrder, snobiOptions.id);
  return rows.map((row) => ({
    id: row.id,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    imageUrl: snobiImageUrl(row.imageKey),
  }));
}

async function toSessionUser(user: CurrentUser): Promise<SessionUser> {
  const { id, ...rest } = user;
  const worn = await loadWornUrls([id]);
  return { ...rest, wornUrls: worn.get(id) ?? [] };
}

export async function loadSessionUser(): Promise<SessionUser | null> {
  noStore();
  const user = await getCurrentUser();
  return user ? toSessionUser(user) : null;
}

function loadWardrobeRows(userId: string): Promise<WardrobeRow[]> {
  return getDb()
    .select({
      productId: products.id,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      wearableKey: products.wearableKey,
      status: orders.status,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orders.userId, userId));
}

export async function loadMyAccount(): Promise<MyAccount> {
  const user = await requireUser();
  noStore();
  const db = getDb();
  const [myOrders, wardrobeRows, wornRows] = await Promise.all([
    db
      .select({
        reference: orders.reference,
        accessToken: orders.accessToken,
        status: orders.status,
        subtotalCents: orders.subtotalCents,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt)),
    loadWardrobeRows(user.id),
    db
      .select({ productId: userWornItems.productId })
      .from(userWornItems)
      .where(eq(userWornItems.userId, user.id)),
  ]);
  return {
    user: await toSessionUser(user),
    donatedCents: donatedCents(myOrders),
    orders: myOrders,
    wardrobe: buildWardrobe(wardrobeRows, new Set(wornRows.map((r) => r.productId))),
  };
}

export async function updateProfileServer(input: {
  snobiOptionId: string;
  displayName: string;
  title: string | null;
  isPublic: boolean;
}): Promise<AccountResult> {
  const user = await requireUser();
  const db = getDb();
  // A retired option can be kept by whoever already has it, but not newly picked.
  if (input.snobiOptionId !== user.snobiOptionId) {
    const [option] = await db
      .select({ id: snobiOptions.id })
      .from(snobiOptions)
      .where(and(eq(snobiOptions.id, input.snobiOptionId), eq(snobiOptions.active, true)));
    if (!option) return { ok: false, error: "snobi_unavailable" };
  }
  await db
    .update(users)
    .set({ ...input, updatedAt: Date.now() })
    .where(eq(users.id, user.id));
  return { ok: true };
}

export async function setWornServer(input: {
  productId: string;
  worn: boolean;
}): Promise<WornResult> {
  const user = await requireUser();
  const db = getDb();
  if (!input.worn) {
    await db
      .delete(userWornItems)
      .where(and(eq(userWornItems.userId, user.id), eq(userWornItems.productId, input.productId)));
    return { ok: true };
  }
  const wardrobe = buildWardrobe(await loadWardrobeRows(user.id), new Set());
  if (!wardrobe.some((item) => item.productId === input.productId)) {
    return { ok: false, error: "not_wearable" };
  }
  await db
    .insert(userWornItems)
    .values({ userId: user.id, productId: input.productId })
    .onConflictDoNothing();
  return { ok: true };
}

export async function changePasswordServer(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AccountResult> {
  const user = await requireUser();
  const check = await verifyCurrentPassword(user.id, input.currentPassword);
  if (!check.ok) return check;
  await hashAndRefresh(user.id, input.newPassword, check.sessionVersion + 1);
  return { ok: true };
}

export async function deleteAccountServer(input: { password: string }): Promise<AccountResult> {
  const user = await requireUser();
  const check = await verifyCurrentPassword(user.id, input.password);
  if (!check.ok) return check;
  const db = getDb();
  // Orders stay for the shop's records, just no longer tied to anyone. The live column has no
  // ON DELETE SET NULL, so unlink them explicitly or the delete fails.
  await db.batch([
    db
      .update(orders)
      .set({ userId: null, updatedAt: Date.now() })
      .where(eq(orders.userId, user.id)),
    db.delete(userWornItems).where(eq(userWornItems.userId, user.id)),
    db.delete(users).where(eq(users.id, user.id)),
  ]);
  logoutUser();
  return { ok: true };
}
