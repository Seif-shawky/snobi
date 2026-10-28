import { beforeEach, describe, expect, it } from "vitest";
import { CART_STORAGE_KEY, cartCount, sanitizeLines, useCartStore } from "@/stores/cart";

const state = () => useCartStore.getState();

beforeEach(() => {
  localStorage.clear();
  useCartStore.setState({ lines: [], removedNotice: false });
});

describe("cart store", () => {
  it("adds lines and merges repeat adds of the same variant", () => {
    expect(state().addItem("v1")).toEqual({ quantity: 1, capped: false });
    expect(state().addItem("v2", 3)).toEqual({ quantity: 3, capped: false });
    expect(state().addItem("v1", 2)).toEqual({ quantity: 3, capped: false });
    expect(state().lines).toEqual([
      { variantId: "v1", quantity: 3 },
      { variantId: "v2", quantity: 3 },
    ]);
    expect(cartCount(state().lines)).toBe(6);
  });

  it("clamps each line at 10 and reports the cap", () => {
    state().addItem("v1", 8);
    expect(state().addItem("v1", 5)).toEqual({ quantity: 10, capped: true });
    state().setQuantity("v1", 99);
    expect(state().lines[0]?.quantity).toBe(10);
  });

  it("updates quantity and removes at zero", () => {
    state().addItem("v1", 2);
    state().setQuantity("v1", 5);
    expect(state().lines[0]?.quantity).toBe(5);
    state().setQuantity("v1", 0);
    expect(state().lines).toEqual([]);
  });

  it("removes a single line and clears everything", () => {
    state().addItem("v1");
    state().addItem("v2");
    state().removeItem("v1");
    expect(state().lines.map((l) => l.variantId)).toEqual(["v2"]);
    state().clear();
    expect(state().lines).toEqual([]);
  });

  it("prunes variants the server no longer knows and flags a notice", () => {
    state().addItem("v1");
    state().addItem("gone");
    state().pruneRemoved(["gone"]);
    expect(state().lines.map((l) => l.variantId)).toEqual(["v1"]);
    expect(state().removedNotice).toBe(true);
    state().dismissNotice();
    state().pruneRemoved(["not-in-bag"]);
    expect(state().removedNotice).toBe(false);
  });

  it("persists only variant ids and quantities", () => {
    state().addItem("v1", 2);
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "{}");
    expect(saved.state).toEqual({ lines: [{ variantId: "v1", quantity: 2 }] });
  });

  it("rehydrates sanitised lines from storage", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          lines: [
            { variantId: "v1", quantity: 4, priceCents: 1 },
            { variantId: "v1", quantity: 9 },
            { variantId: "", quantity: 1 },
            { variantId: "v2", quantity: -3 },
            "junk",
          ],
        },
      }),
    );
    await useCartStore.persist.rehydrate();
    expect(state().lines).toEqual([{ variantId: "v1", quantity: 10 }]);
  });

  it("sanitizeLines tolerates garbage", () => {
    expect(sanitizeLines(null)).toEqual([]);
    expect(sanitizeLines({})).toEqual([]);
    expect(sanitizeLines([{ variantId: "a", quantity: 2.7 }])).toEqual([
      { variantId: "a", quantity: 2 },
    ]);
  });
});
