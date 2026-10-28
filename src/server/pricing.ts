import { MAX_LINE_QUANTITY, type CartLineInput } from "@/lib/order-schema";
import type { CartQuote, LineStatus, QuoteLine } from "@/lib/cart-types";

// Pure pricing logic shared by quoteCart and placeOrder. No database access here, so it is
// unit-testable; callers pass the variant rows they read from D1.

export interface VariantRow {
  variantId: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  size: string;
  priceCents: number;
  stock: number;
  variantActive: boolean;
  productActive: boolean;
  image: { url: string; altEn: string; altAr: string } | null;
}

// Merges duplicate variant ids (summing quantities) and clamps each line to 1..MAX.
export function mergeLines(lines: readonly CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) continue;
    merged.set(line.variantId, (merged.get(line.variantId) ?? 0) + line.quantity);
  }
  return [...merged].map(([variantId, quantity]) => ({
    variantId,
    quantity: Math.min(quantity, MAX_LINE_QUANTITY),
  }));
}

export function lineStatus(row: VariantRow, quantity: number): LineStatus {
  if (!row.variantActive || !row.productActive) return "unavailable";
  if (row.stock <= 0) return "sold_out";
  if (row.stock < quantity) return "insufficient";
  return "ok";
}

export function buildQuote(
  lines: readonly CartLineInput[],
  rows: readonly VariantRow[],
): CartQuote {
  const byId = new Map(rows.map((r) => [r.variantId, r]));
  const quoteLines: QuoteLine[] = [];
  const removed: string[] = [];
  for (const line of mergeLines(lines)) {
    const row = byId.get(line.variantId);
    if (!row) {
      removed.push(line.variantId);
      continue;
    }
    const status = lineStatus(row, line.quantity);
    quoteLines.push({
      variantId: row.variantId,
      productSlug: row.slug,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      size: row.size,
      image: row.image,
      unitPriceCents: row.priceCents,
      quantity: line.quantity,
      lineTotalCents: row.priceCents * line.quantity,
      status,
      maxQuantity:
        status === "ok" || status === "insufficient" ? Math.min(row.stock, MAX_LINE_QUANTITY) : 0,
    });
  }
  const ok = quoteLines.filter((l) => l.status === "ok");
  return {
    lines: quoteLines,
    removed,
    // Only lines that can actually be ordered count towards the subtotal.
    subtotalCents: ok.reduce((sum, l) => sum + l.lineTotalCents, 0),
    itemCount: ok.reduce((sum, l) => sum + l.quantity, 0),
    orderable: quoteLines.length > 0 && removed.length === 0 && ok.length === quoteLines.length,
    currency: "EGP",
  };
}

export interface PricedItem {
  productId: string;
  variantId: string;
  productNameEn: string;
  productNameAr: string;
  size: string;
  unitPriceCents: number;
  quantity: number;
}

export type PriceOrderResult =
  | { ok: true; items: PricedItem[]; subtotalCents: number }
  | { ok: false; error: "out_of_stock" | "unavailable"; variantIds: string[] };

// Server-side pricing for placeOrder: every line must exist, be active and have enough stock.
export function priceOrder(
  lines: readonly CartLineInput[],
  rows: readonly VariantRow[],
): PriceOrderResult {
  const merged = mergeLines(lines);
  const byId = new Map(rows.map((r) => [r.variantId, r]));
  const unavailable: string[] = [];
  const short: string[] = [];
  const items: PricedItem[] = [];
  for (const line of merged) {
    const row = byId.get(line.variantId);
    const status = row ? lineStatus(row, line.quantity) : "unavailable";
    if (!row || status === "unavailable") unavailable.push(line.variantId);
    else if (status !== "ok") short.push(line.variantId);
    else
      items.push({
        productId: row.productId,
        variantId: row.variantId,
        productNameEn: row.nameEn,
        productNameAr: row.nameAr,
        size: row.size,
        unitPriceCents: row.priceCents,
        quantity: line.quantity,
      });
  }
  if (merged.length === 0 || unavailable.length)
    return { ok: false, error: "unavailable", variantIds: unavailable };
  if (short.length) return { ok: false, error: "out_of_stock", variantIds: short };
  return {
    ok: true,
    items,
    subtotalCents: items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
  };
}
