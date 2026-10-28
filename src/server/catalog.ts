import { and, asc, eq, inArray } from "drizzle-orm";
import type { CatalogProduct } from "@/lib/catalog";
import { getDb } from "./db/client";
import { productImages, products, variants } from "./db/schema";

export function imageUrl(r2Key: string) {
  return `/images/${r2Key}`;
}

// Loads active products with their active variants and images, shaped for the storefront.
export async function loadCatalog(filter?: { slug?: string }): Promise<CatalogProduct[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(
      and(eq(products.status, "active"), filter?.slug ? eq(products.slug, filter.slug) : undefined),
    )
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
  if (rows.length === 0) return [];

  const ids = rows.map((p) => p.id);
  const [variantRows, imageRows] = await Promise.all([
    db
      .select()
      .from(variants)
      .where(and(inArray(variants.productId, ids), eq(variants.active, true)))
      .orderBy(asc(variants.sortOrder), asc(variants.createdAt)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt)),
  ]);

  return rows.map((p) => {
    const vs = variantRows
      .filter((v) => v.productId === p.id)
      .map((v) => ({
        id: v.id,
        size: v.size,
        priceCents: v.priceCents,
        available: v.stock > 0,
        // Exact counts are only exposed when low, for an honest "only N left" note.
        lowStock: v.stock > 0 && v.stock <= 3 ? v.stock : null,
      }));
    return {
      id: p.id,
      slug: p.slug,
      nameEn: p.nameEn,
      nameAr: p.nameAr,
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
      images: imageRows
        .filter((i) => i.productId === p.id)
        .map((i) => ({ url: imageUrl(i.r2Key), altEn: i.altEn, altAr: i.altAr })),
      variants: vs,
      minPriceCents: vs.length ? Math.min(...vs.map((v) => v.priceCents)) : null,
      available: vs.some((v) => v.available),
    };
  });
}
