import { asc, eq, inArray } from "drizzle-orm";
import type { CartQuote } from "@/lib/cart-types";
import type { CartLineInput } from "@/lib/order-schema";
import { imageUrl } from "./catalog";
import { getDb } from "./db/client";
import { productImages, products, variants } from "./db/schema";
import { buildQuote, mergeLines, type VariantRow } from "./pricing";

// Reads the current state of the given variants (any status) with their product and first image.
export async function loadVariantRows(variantIds: readonly string[]): Promise<VariantRow[]> {
  if (variantIds.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select({
      variantId: variants.id,
      productId: products.id,
      slug: products.slug,
      nameEn: products.nameEn,
      nameAr: products.nameAr,
      size: variants.size,
      priceCents: variants.priceCents,
      stock: variants.stock,
      variantActive: variants.active,
      productStatus: products.status,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .where(inArray(variants.id, [...variantIds]));
  if (rows.length === 0) return [];

  const productIds = [...new Set(rows.map((r) => r.productId))];
  const images = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt));

  return rows.map(({ productStatus, ...r }) => {
    const image = images.find((i) => i.productId === r.productId);
    return {
      ...r,
      productActive: productStatus === "active",
      image: image ? { url: imageUrl(image.r2Key), altEn: image.altEn, altAr: image.altAr } : null,
    };
  });
}

export async function quoteCartServer(lines: readonly CartLineInput[]): Promise<CartQuote> {
  const merged = mergeLines(lines);
  const rows = await loadVariantRows(merged.map((l) => l.variantId));
  return buildQuote(merged, rows);
}
