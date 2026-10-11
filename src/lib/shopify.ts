import { queryOptions } from '@tanstack/react-query';

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: { nodes: { url: string; altText: string | null }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants?: { nodes: { id: string; title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; selectedOptions: { name: string; value: string }[] }[] };
}

export async function storefrontApiRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch('https://welcome-home-3gwf3-r1aw1fme.myshopify.com/api/2025-07/graphql.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': 'bab9571107806dd8545dfca4246cb548' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error('The store could not be reached. Please try again.');
  const result = await response.json() as { data: T; errors?: { message: string }[] };
  if (result.errors?.length) throw new Error('The store could not be reached. Please try again.');
  return result.data;
}

export const productsQuery = queryOptions({
  queryKey: ['snobi', 'products'],
  queryFn: () => storefrontApiRequest<{ products: { nodes: Product[] } }>(`query { products(first: 3) { nodes { id title handle description images(first: 1) { nodes { url altText } } priceRange { minVariantPrice { amount currencyCode } } } } }`),
  staleTime: 60_000,
  retry: 1,
});