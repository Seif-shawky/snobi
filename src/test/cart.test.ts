import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changeShopifyCart, readShopifyCart, type ShopifyCart } from '@/lib/cart-api';
import { useCartStore } from '@/stores/cart';
vi.mock('@/lib/cart-api', () => ({ changeShopifyCart: vi.fn(), readShopifyCart: vi.fn() }));
const fixture = { id: 'test-cart', checkoutUrl: 'https://example.com/checkout', totalQuantity: 1, cost: { subtotalAmount: { amount: '10', currencyCode: 'EGP' } }, lines: { nodes: [] } } satisfies ShopifyCart;
beforeEach(() => { vi.resetAllMocks(); useCartStore.setState({ cart: null, busy: false, error: null }); });
describe('Shopify cart state', () => {
  it('creates a cart on first add and adds later lines to the same cart', async () => {
    vi.mocked(changeShopifyCart).mockResolvedValue(fixture);
    expect(await useCartStore.getState().addItem('gid://shopify/ProductVariant/test')).toBe(true);
    expect(changeShopifyCart).toHaveBeenLastCalledWith('cartCreate', { input: { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/test', quantity: 1 }] } });
    await useCartStore.getState().addItem('second');
    expect(changeShopifyCart).toHaveBeenLastCalledWith('cartLinesAdd', { cartId: 'test-cart', lines: [{ merchandiseId: 'second', quantity: 1 }] });
  });
  it('preserves the cart on network failure but clears expired carts', async () => {
    useCartStore.setState({ cart: fixture });
    vi.mocked(readShopifyCart).mockRejectedValueOnce(new Error('network'));
    await useCartStore.getState().syncCart();
    expect(useCartStore.getState().cart).toEqual(fixture);
    expect(useCartStore.getState().error).toBe('failed');
    vi.mocked(changeShopifyCart).mockRejectedValueOnce(new Error('cart-expired'));
    await useCartStore.getState().removeItem('line');
    expect(useCartStore.getState().cart).toBeNull();
    expect(useCartStore.getState().error).toBe('expired');
  });
  it('uses line IDs to update and removes at zero quantity', async () => {
    useCartStore.setState({ cart: fixture });
    vi.mocked(changeShopifyCart).mockResolvedValue(fixture);
    await useCartStore.getState().updateQuantity('shopify-line', 2);
    expect(changeShopifyCart).toHaveBeenLastCalledWith('cartLinesUpdate', { cartId: 'test-cart', lines: [{ id: 'shopify-line', quantity: 2 }] });
    await useCartStore.getState().updateQuantity('shopify-line', 0);
    expect(changeShopifyCart).toHaveBeenLastCalledWith('cartLinesRemove', { cartId: 'test-cart', lineIds: ['shopify-line'] });
  });
  it('clears completed or missing carts on sync and prevents parallel changes', async () => {
    useCartStore.setState({ cart: fixture, busy: true });
    expect(await useCartStore.getState().addItem('variant')).toBe(false);
    expect(changeShopifyCart).not.toHaveBeenCalled();
    useCartStore.setState({ busy: false });
    vi.mocked(readShopifyCart).mockResolvedValue(null);
    await useCartStore.getState().syncCart();
    expect(useCartStore.getState().cart).toBeNull();
  });
});