import { createFileRoute, notFound } from '@tanstack/react-router';
import { storefrontApiRequest, type Product } from '@/lib/shopify';
export const Route = createFileRoute('/product/$handle')({
  loader: async ({ params }) => {
    const data = await storefrontApiRequest<{ product: Product | null }>(`query($handle: String!) { product(handle: $handle) { id title handle description images(first: 5) { nodes { url altText } } priceRange { minVariantPrice { amount currencyCode } } } }`, { handle: params.handle });
    if (!data.product) throw notFound();
    return data.product;
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.title} — Snobi` : 'Shirt Not Found — Snobi' }, { name: 'description', content: loaderData?.description ?? 'This Snobi shirt could not be found.' }, { property: 'og:title', content: loaderData?.title ?? 'Shirt Not Found — Snobi' }, { property: 'og:description', content: loaderData?.description ?? 'This Snobi shirt could not be found.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: ProductPage,
});
function ProductPage() { const product = Route.useLoaderData(); return <section className="page-width standalone-section"><h1>{product.title}</h1><div className="product-grid">{product.images.nodes.map(image => <img key={image.url} src={image.url} alt={image.altText ?? product.title} />)}</div><p>{product.description}</p><p>{product.priceRange.minVariantPrice.amount} {product.priceRange.minVariantPrice.currencyCode}</p></section>; }