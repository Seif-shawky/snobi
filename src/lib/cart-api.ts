import { storefrontApiRequest } from '@/lib/shopify';

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: { nodes: Array<{ id: string; quantity: number; merchandise: { id: string; title: string; availableForSale: boolean; selectedOptions: { name: string; value: string }[]; product: { title: string; handle: string }; image: { url: string; altText: string | null } | null }; cost: { totalAmount: { amount: string; currencyCode: string } } }> };
}
const fields = `id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } } lines(first: 100) { nodes { id quantity cost { totalAmount { amount currencyCode } } merchandise { ... on ProductVariant { id title availableForSale selectedOptions { name value } image { url altText } product { title handle } } } } }`;
type MutationResult = { cart: ShopifyCart | null; userErrors: { message: string }[] };
export async function readShopifyCart(id: string) {
  return (await storefrontApiRequest<{ cart: ShopifyCart | null }>(`query($id: ID!) { cart(id: $id) { ${fields} } }`, { id })).cart;
}
export async function changeShopifyCart(kind: 'cartCreate' | 'cartLinesAdd' | 'cartLinesUpdate' | 'cartLinesRemove', variables: Record<string, unknown>) {
  const signatures = {
    cartCreate: ['$input: CartInput!', 'input: $input'],
    cartLinesAdd: ['$cartId: ID!, $lines: [CartLineInput!]!', 'cartId: $cartId, lines: $lines'],
    cartLinesUpdate: ['$cartId: ID!, $lines: [CartLineUpdateInput!]!', 'cartId: $cartId, lines: $lines'],
    cartLinesRemove: ['$cartId: ID!, $lineIds: [ID!]!', 'cartId: $cartId, lineIds: $lineIds'],
  };
  const [signature, args] = signatures[kind];
  const data = await storefrontApiRequest<Record<string, MutationResult>>(`mutation(${signature}) { ${kind}(${args}) { cart { ${fields} } userErrors { message } } }`, variables);
  const result = data[kind];
  if (!result) throw new Error('cart-update-failed');
  if (result.userErrors.length) {
    if (result.userErrors.some(e => /cart.*(not found|does not exist|invalid|expired)/i.test(e.message))) throw new Error('cart-expired');
    throw new Error('cart-update-failed');
  }
  if (!result.cart) throw new Error('cart-expired');
  return result.cart;
}
export function formatCheckoutUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('checkout-unavailable');
  url.searchParams.set('channel', 'online_store');
  return url.toString();
}