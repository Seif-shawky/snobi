import { describe, expect, it, vi, beforeEach } from 'vitest';
import { changeShopifyCart, formatCheckoutUrl } from '@/lib/cart-api';
import { storefrontApiRequest } from '@/lib/shopify';
vi.mock('@/lib/shopify', () => ({ storefrontApiRequest: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
describe('Shopify checkout and errors', () => {
  it('adds online_store to the returned checkout URL and rejects non-HTTPS URLs', () => {
    const url = new URL(formatCheckoutUrl('https://example.com/checkout?key=test'));
    expect(url.searchParams.get('channel')).toBe('online_store');
    expect(url.searchParams.get('key')).toBe('test');
    expect(() => formatCheckoutUrl('javascript:alert(1)')).toThrow();
  });
  it('surfaces Shopify user errors without committing a cart', async () => {
    vi.mocked(storefrontApiRequest).mockResolvedValue({ cartCreate: { cart: null, userErrors: [{ message: 'Invalid merchandise' }] } });
    await expect(changeShopifyCart('cartCreate', { input: { lines: [] } })).rejects.toThrow('cart-update-failed');
    vi.mocked(storefrontApiRequest).mockResolvedValue({ cartLinesUpdate: { cart: null, userErrors: [{ message: 'Cart does not exist' }] } });
    await expect(changeShopifyCart('cartLinesUpdate', {})).rejects.toThrow('cart-expired');
  });
});