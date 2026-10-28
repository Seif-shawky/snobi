import { env } from "cloudflare:workers";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { LOW_STOCK_THRESHOLD, type FieldErrors, type ProductFormOutput } from "@/lib/admin-shared";
import { getDb } from "../db/client";
import { orders, productImages, products, variants } from "../db/schema";
import { requireAdmin } from "./auth";

export type SaveProductResult = { ok: true; id: string } | { ok: false; fieldErrors: FieldErrors };

type Batch = [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]];

export async function adminDashboard() {
  await requireAdmin();
  const db = getDb();
  const count = sql<number>`count(*)`;
  const [active, lowStock, pending] = await Promise.all([
    db.select({ count }).from(products).where(eq(products.status, "active")),
    db
      .select({ count })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(
        and(
          eq(variants.active, true),
          ne(products.status, "archived"),
          sql`${variants.stock} <= ${LOW_STOCK_THRESHOLD}`,
        ),
      ),
    db.select({ count }).from(orders).where(eq(orders.status, "pending")),
  ]);
  return {
    activeProducts: active[0]?.count ?? 0,
    lowStockVariants: lowStock[0]?.count ?? 0,
    pendingOrders: pending[0]?.count ?? 0,
  };
}

export async function adminListProducts() {
  await requireAdmin();
  const db = getDb();
  const [rows, variantRows, imageRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.sortOrder), desc(products.createdAt)),
    db.select().from(variants).orderBy(asc(variants.sortOrder)),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
  ]);
  return rows.map((p) => {
    const vs = variantRows.filter((v) => v.productId === p.id);
    const prices = vs.filter((v) => v.active).map((v) => v.priceCents);
    const cover = imageRows.find((i) => i.productId === p.id);
    return {
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      status: p.status,
      coverKey: cover?.r2Key ?? null,
      sizes: vs.map((v) => ({ size: v.size, stock: v.stock, active: v.active })),
      minPriceCents: prices.length ? Math.min(...prices) : null,
      maxPriceCents: prices.length ? Math.max(...prices) : null,
    };
  });
}

export async function adminGetProduct(id: string) {
  await requireAdmin();
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;
  const [variantRows, imageRows] = await Promise.all([
    db
      .select()
      .from(variants)
      .where(eq(variants.productId, id))
      .orderBy(asc(variants.sortOrder), asc(variants.createdAt)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)),
  ]);
  return { product, variants: variantRows, images: imageRows };
}

function isUniqueSlugError(error: unknown) {
  const text = String(error instanceof Error ? `${error.message} ${String(error.cause)}` : error);
  return /UNIQUE/i.test(text) && /slug/i.test(text);
}

export async function adminSaveProduct(
  id: string | null,
  input: ProductFormOutput,
): Promise<SaveProductResult> {
  await requireAdmin();
  const db = getDb();

  const clash = await db
    .select({ id: products.id })
    .from(products)
    .where(
      id ? and(eq(products.slug, input.slug), ne(products.id, id)) : eq(products.slug, input.slug),
    );
  if (clash.length) {
    return { ok: false, fieldErrors: { slug: "Another product already uses this web address" } };
  }

  const now = Date.now();
  const productId = id ?? crypto.randomUUID();
  const fields = {
    slug: input.slug,
    nameEn: input.nameEn,
    nameAr: input.nameAr,
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    status: input.status,
    phase: input.phase,
    sortOrder: input.sortOrder,
    updatedAt: now,
  };

  const existingIds = id
    ? new Set(
        (await db.select({ id: variants.id }).from(variants).where(eq(variants.productId, id))).map(
          (v) => v.id,
        ),
      )
    : new Set<string>();
  if (id && existingIds.size === 0) {
    const [found] = await db.select({ id: products.id }).from(products).where(eq(products.id, id));
    if (!found) return { ok: false, fieldErrors: { form: "This product no longer exists" } };
  }

  const keptIds = new Set<string>();
  const statements: BatchItem<"sqlite">[] = [];
  statements.push(
    id
      ? db.update(products).set(fields).where(eq(products.id, id))
      : db.insert(products).values({ id: productId, ...fields, createdAt: now }),
  );

  input.variants.forEach((v, index) => {
    const values = {
      size: v.size,
      sku: v.sku,
      priceCents: v.price,
      stock: v.stock,
      active: v.active,
      sortOrder: index,
      updatedAt: now,
    };
    // Keep existing variant ids so order items can still restore stock to them on cancel.
    if (v.id && existingIds.has(v.id)) {
      keptIds.add(v.id);
      statements.push(db.update(variants).set(values).where(eq(variants.id, v.id)));
    } else {
      statements.push(
        db
          .insert(variants)
          .values({ id: crypto.randomUUID(), productId, ...values, createdAt: now }),
      );
    }
  });

  const removed = [...existingIds].filter((v) => !keptIds.has(v));
  if (removed.length) statements.push(db.delete(variants).where(inArray(variants.id, removed)));

  try {
    await db.batch(statements as Batch);
  } catch (error) {
    if (isUniqueSlugError(error)) {
      return { ok: false, fieldErrors: { slug: "Another product already uses this web address" } };
    }
    throw error;
  }
  return { ok: true, id: productId };
}

export async function adminDeleteProduct(id: string) {
  await requireAdmin();
  const db = getDb();
  const images = await db
    .select({ key: productImages.r2Key })
    .from(productImages)
    .where(eq(productImages.productId, id));
  // Explicit child deletes so this doesn't depend on SQLite foreign-key enforcement.
  await db.batch([
    db.delete(productImages).where(eq(productImages.productId, id)),
    db.delete(variants).where(eq(variants.productId, id)),
    db.delete(products).where(eq(products.id, id)),
  ]);
  if (images.length) await env.IMAGES.delete(images.map((i) => i.key));
  return { ok: true as const };
}
