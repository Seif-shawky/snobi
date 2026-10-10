import { createFileRoute } from '@tanstack/react-router';
import { Collection } from '@/components/snobi';
import { productsQuery } from '@/lib/shopify';
import { ShopPreview } from '@/components/shop-preview';
export const Route = createFileRoute('/shop')({
  head: () => ({ meta: [{ title: 'Snobi Needs Money. — The Clothes' }, { name: 'description', content: 'Explore Snobi’s Phase 0 clothing ideas, original mockups, and available collection. Clothes for you. Hope for Snobi.' }, { property: 'og:title', content: 'Snobi Needs Money. — The Clothes' }, { property: 'og:description', content: 'A first look at Snobi’s clothing ideas. Prices and sizes to be confirmed.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(productsQuery); },
  component: () => <><ShopPreview /><Collection /></>,
});