import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_CART_LINES, MAX_LINE_QUANTITY, type CartLineInput } from "@/lib/order-schema";

// The bag only remembers which variants and how many. Names, prices and stock always come
// from the server quote (see useCartQuote), never from what was stored in the browser.

export type CartLine = CartLineInput;

export const CART_STORAGE_KEY = "snobi-cart-v1";

export function clampQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

// Drops malformed entries (e.g. hand-edited storage) and merges duplicates.
export function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const lines: CartLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { variantId, quantity } = item as Record<string, unknown>;
    if (typeof variantId !== "string" || !variantId || variantId.length > 64) continue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 1) continue;
    const existing = lines.find((l) => l.variantId === variantId);
    if (existing) existing.quantity = clampQuantity(existing.quantity + quantity);
    else lines.push({ variantId, quantity: clampQuantity(quantity) });
  }
  return lines.slice(0, MAX_CART_LINES);
}

export interface AddResult {
  // Quantity of this variant now in the bag.
  quantity: number;
  // True when the request was cut down by the per-line limit or the bag is full.
  capped: boolean;
}

interface CartState {
  lines: CartLine[];
  // Set when the server reported variants that no longer exist and they were dropped.
  removedNotice: boolean;
  addItem: (variantId: string, quantity?: number) => AddResult;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  pruneRemoved: (variantIds: readonly string[]) => void;
  dismissNotice: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      removedNotice: false,
      addItem: (variantId, quantity = 1) => {
        const lines = get().lines;
        const existing = lines.find((l) => l.variantId === variantId);
        const wanted = Math.max(1, Math.trunc(quantity)) + (existing?.quantity ?? 0);
        if (!existing && lines.length >= MAX_CART_LINES) return { quantity: 0, capped: true };
        const next = clampQuantity(wanted);
        set({
          lines: existing
            ? lines.map((l) => (l.variantId === variantId ? { ...l, quantity: next } : l))
            : [...lines, { variantId, quantity: next }],
        });
        return { quantity: next, capped: next < wanted };
      },
      setQuantity: (variantId, quantity) => {
        if (quantity < 1) return get().removeItem(variantId);
        set({
          lines: get().lines.map((l) =>
            l.variantId === variantId ? { ...l, quantity: clampQuantity(quantity) } : l,
          ),
        });
      },
      removeItem: (variantId) =>
        set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),
      pruneRemoved: (variantIds) => {
        const lines = get().lines.filter((l) => !variantIds.includes(l.variantId));
        if (lines.length !== get().lines.length) set({ lines, removedNotice: true });
      },
      dismissNotice: () => set({ removedNotice: false }),
      clear: () => set({ lines: [], removedNotice: false }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated after mount by SnobiShell so server and first client render match.
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
      merge: (persisted, current) => ({
        ...current,
        lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
    },
  ),
);

export const cartCount = (lines: readonly CartLine[]) =>
  lines.reduce((sum, l) => sum + l.quantity, 0);
