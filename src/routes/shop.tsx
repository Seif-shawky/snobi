import { createFileRoute } from '@tanstack/react-router';
import { Collection } from '@/components/snobi';
import { productsQuery } from '@/lib/shopify';
export const Route = createFileRoute('/shop')({
  head: () => ({ meta: [{ title: 'The First Drop — Snobi' }, { name: 'description', content: 'The first Snobi T-shirt collection. Limited shirts, unlimited financial problems.' }, { property: 'og:title', content: 'Snobi Needs Money. — The First Drop' }, { property: 'og:description', content: 'Explore the first Snobi collection.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(productsQuery); },
  component: () => <Collection standalone />,
});