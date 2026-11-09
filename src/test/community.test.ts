import { describe, expect, it } from "vitest";
import {
  buildWardrobe,
  totalDonations,
  joinRedirectTarget,
  type OrderStatus,
  type WardrobeRow,
} from "@/lib/account-rules";
import { relativeTime } from "@/lib/community-rules";
import { phaseProgressPercent } from "@/lib/phase";

describe("phaseProgressPercent", () => {
  it("rounds down and caps at 100", () => {
    expect(phaseProgressPercent(0, 1000)).toBe(0);
    expect(phaseProgressPercent(999, 1000)).toBe(99);
    expect(phaseProgressPercent(5000, 1000)).toBe(100);
  });
});

describe("joinRedirectTarget", () => {
  it("only ever goes to checkout or the account page", () => {
    expect(joinRedirectTarget("checkout")).toBe("/checkout");
    for (const value of ["account", "https://evil.example", "//evil.example", "/admin", null, 1]) {
      expect(joinRedirectTarget(value)).toBe("/account");
    }
  });
});

describe("totalDonations", () => {
  it("counts confirmed, shipped and delivered orders only", () => {
    const orders = (
      ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"] as OrderStatus[]
    ).map((status) => ({ status, donations: 100 }));
    expect(totalDonations(orders)).toBe(300);
  });
});

describe("buildWardrobe", () => {
  const row = (over: Partial<WardrobeRow>): WardrobeRow => ({
    productId: "p1",
    nameEn: "Shirt",
    nameAr: "تيشيرت",
    wearableKey: "products/p1/wear.png",
    status: "delivered",
    ...over,
  });

  it("lists delivered wearable items with their overlay and worn state", () => {
    expect(buildWardrobe([row({})], new Set(["p1"]))).toEqual([
      {
        productId: "p1",
        nameEn: "Shirt",
        nameAr: "تيشيرت",
        overlayUrl: "/images/products/p1/wear.png",
        worn: true,
      },
    ]);
  });

  it("leaves out anything not delivered, not wearable or deleted", () => {
    for (const status of ["pending", "confirmed", "shipped", "cancelled", "returned"] as const) {
      expect(buildWardrobe([row({ status })], new Set())).toEqual([]);
    }
    expect(buildWardrobe([row({ wearableKey: null })], new Set())).toEqual([]);
    expect(buildWardrobe([row({ productId: null })], new Set())).toEqual([]);
  });

  it("lists a product once, and keeps it if another delivered order still has it", () => {
    const items = buildWardrobe(
      [row({}), row({ status: "returned" }), row({ status: "delivered" })],
      new Set(),
    );
    expect(items).toHaveLength(1);
  });
});

describe("relativeTime", () => {
  const now = 1_000_000_000;
  const minutes = (n: number) => now - n * 60_000;

  it("counts up from just now, in both languages", () => {
    expect(relativeTime(now, now, false)).toBe("just now");
    expect(relativeTime(now + 5000, now, false)).toBe("just now");
    expect(relativeTime(minutes(5), now, false)).toBe("5 min ago");
    expect(relativeTime(minutes(60), now, false)).toBe("1 hour ago");
    expect(relativeTime(minutes(60 * 48), now, false)).toBe("2 days ago");
    expect(relativeTime(now, now, true)).toBe("دلوقتي");
    expect(relativeTime(minutes(2), now, true)).toBe("من دقيقتين");
    expect(relativeTime(minutes(5), now, true)).toBe("من ٥ دقايق");
  });
});
