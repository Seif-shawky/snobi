import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { changeShopifyCart, readShopifyCart, type ShopifyCart } from '@/lib/cart-api';

interface CartState {
  cart: ShopifyCart | null;
  busy: boolean;
  error: string | null;
  syncCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
}
export const useCartStore = create<CartState>()(persist((set, get) => {
  const failure = (error: unknown) => {
    const expired = error instanceof Error && error.message === 'cart-expired';
    set({ ...(expired ? { cart: null } : {}), error: expired ? 'expired' : 'failed' });
  };
  const update = async (kind: 'cartLinesUpdate' | 'cartLinesRemove', variables: Record<string, unknown>) => {
    const { cart, busy } = get();
    if (!cart || busy) return;
    set({ busy: true, error: null });
    try {
      const next = await changeShopifyCart(kind, { cartId: cart.id, ...variables });
      set({ cart: next.totalQuantity ? next : null });
    } catch (error) { failure(error); } finally { set({ busy: false }); }
  };
  return {
    cart: null, busy: false, error: null,
    syncCart: async () => {
      const { cart, busy } = get();
      if (!cart || busy) return;
      set({ busy: true, error: null });
      try { const next = await readShopifyCart(cart.id); set({ cart: next?.totalQuantity ? next : null }); }
      catch (error) { failure(error); } finally { set({ busy: false }); }
    },
    addItem: async (variantId, quantity = 1) => {
      if (get().busy || !Number.isInteger(quantity) || quantity < 1) return false;
      set({ busy: true, error: null });
      try {
        const { cart } = get();
        const lines = [{ merchandiseId: variantId, quantity }];
        const next = await changeShopifyCart(cart ? 'cartLinesAdd' : 'cartCreate', cart ? { cartId: cart.id, lines } : { input: { lines } });
        set({ cart: next }); return true;
      } catch (error) { failure(error); return false; } finally { set({ busy: false }); }
    },
    updateQuantity: async (id, quantity) => {
      if (!Number.isInteger(quantity) || quantity < 0) return;
      if (quantity === 0) return get().removeItem(id);
      await update('cartLinesUpdate', { lines: [{ id, quantity }] });
    },
    removeItem: async id => { await update('cartLinesRemove', { lineIds: [id] }); },
  };
}, { name: 'snobi-shopify-cart', storage: createJSONStorage(() => localStorage), skipHydration: true, partialize: state => ({ cart: state.cart }) }));