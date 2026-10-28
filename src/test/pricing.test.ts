import { describe, expect, it } from "vitest";
import { buildQuote, mergeLines, priceOrder, type VariantRow } from "@/server/pricing";

const row = (over: Partial<VariantRow> & { variantId: string }): VariantRow => ({
  productId: "p1",
  slug: "tee",
  nameEn: "Tee",
  nameAr: "تيشيرت",
  size: "M",
  priceCents: 45000,
  stock: 5,
  variantActive: true,
  productActive: true,
  image: null,
  ...over,
});

describe("mergeLines", () => {
  it("sums duplicates and clamps to 10", () => {
    expect(
      mergeLines([
        { variantId: "a", quantity: 6 },
        { variantId: "b", quantity: 1 },
        { variantId: "a", quantity: 7 },
      ]),
    ).toEqual([
      { variantId: "a", quantity: 10 },
      { variantId: "b", quantity: 1 },
    ]);
  });
});

describe("buildQuote", () => {
  const rows = [
    row({ variantId: "ok", priceCents: 45000 }),
    row({ variantId: "short", stock: 1, size: "L", priceCents: 50000 }),
    row({ variantId: "soldout", stock: 0 }),
    row({ variantId: "off", variantActive: false }),
    row({ variantId: "archived", productActive: false }),
  ];

  it("prices lines from server rows and totals only orderable lines", () => {
    const quote = buildQuote(
      [
        { variantId: "ok", quantity: 2 },
        { variantId: "short", quantity: 3 },
        { variantId: "soldout", quantity: 1 },
        { variantId: "off", quantity: 1 },
        { variantId: "archived", quantity: 1 },
        { variantId: "missing", quantity: 1 },
      ],
      rows,
    );
    expect(quote.lines.map((l) => [l.variantId, l.status, l.maxQuantity])).toEqual([
      ["ok", "ok", 5],
      ["short", "insufficient", 1],
      ["soldout", "sold_out", 0],
      ["off", "unavailable", 0],
      ["archived", "unavailable", 0],
    ]);
    expect(quote.lines[0]?.lineTotalCents).toBe(90000);
    expect(quote.removed).toEqual(["missing"]);
    expect(quote.subtotalCents).toBe(90000);
    expect(quote.itemCount).toBe(2);
    expect(quote.orderable).toBe(false);
  });

  it("is orderable when every line is in stock", () => {
    const quote = buildQuote(
      [
        { variantId: "ok", quantity: 5 },
        { variantId: "short", quantity: 1 },
      ],
      rows,
    );
    expect(quote.orderable).toBe(true);
    expect(quote.subtotalCents).toBe(5 * 45000 + 50000);
  });

  it("is not orderable when empty", () => {
    expect(buildQuote([], rows).orderable).toBe(false);
  });
});

describe("priceOrder", () => {
  const rows = [
    row({ variantId: "a", priceCents: 45000, stock: 3 }),
    row({ variantId: "b", priceCents: 30000, stock: 1, size: "S", productId: "p2" }),
  ];

  it("snapshots names, sizes and server prices", () => {
    const result = priceOrder(
      [
        { variantId: "a", quantity: 2 },
        { variantId: "b", quantity: 1 },
      ],
      rows,
    );
    expect(result).toEqual({
      ok: true,
      subtotalCents: 120000,
      items: [
        {
          productId: "p1",
          variantId: "a",
          productNameEn: "Tee",
          productNameAr: "تيشيرت",
          size: "M",
          unitPriceCents: 45000,
          quantity: 2,
        },
        {
          productId: "p2",
          variantId: "b",
          productNameEn: "Tee",
          productNameAr: "تيشيرت",
          size: "S",
          unitPriceCents: 30000,
          quantity: 1,
        },
      ],
    });
  });

  it("rejects oversells as out_of_stock", () => {
    expect(priceOrder([{ variantId: "b", quantity: 2 }], rows)).toEqual({
      ok: false,
      error: "out_of_stock",
      variantIds: ["b"],
    });
  });

  it("rejects unknown or inactive variants as unavailable", () => {
    expect(
      priceOrder(
        [
          { variantId: "a", quantity: 1 },
          { variantId: "ghost", quantity: 1 },
        ],
        rows,
      ),
    ).toEqual({ ok: false, error: "unavailable", variantIds: ["ghost"] });
    expect(
      priceOrder(
        [{ variantId: "a", quantity: 1 }],
        [row({ variantId: "a", productActive: false })],
      ),
    ).toMatchObject({
      ok: false,
      error: "unavailable",
    });
    expect(priceOrder([], rows)).toMatchObject({ ok: false, error: "unavailable" });
  });
});
