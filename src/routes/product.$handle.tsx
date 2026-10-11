import { createFileRoute, notFound } from '@tanstack/react-router';
import { storefrontApiRequest, type Product } from '@/lib/shopify';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingBag, Loader2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/snobi';
import { useCartStore } from '@/stores/cart';
export const Route = createFileRoute('/product/$handle')({
  loader: async ({ params }) => {
    const data = await storefrontApiRequest<{ product: Product | null }>(`query($handle: String!) { product(handle: $handle) { id title handle description images(first: 5) { nodes { url altText } } priceRange { minVariantPrice { amount currencyCode } } variants(first: 100) { nodes { id title availableForSale price { amount currencyCode } selectedOptions { name value } } } } }`, { handle: params.handle });
    if (!data.product) throw notFound();
    return data.product;
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData ? `${loaderData.title} — Snobi` : 'Shirt Not Found — Snobi' }, { name: 'description', content: loaderData?.description ?? 'This Snobi shirt could not be found.' }, { property: 'og:title', content: loaderData?.title ?? 'Shirt Not Found — Snobi' }, { property: 'og:description', content: loaderData?.description ?? 'This Snobi shirt could not be found.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: ProductPage,
});
function ProductPage() {
  const product = Route.useLoaderData();
  const { ar } = useLanguage();
  const { addItem, busy, error } = useCartStore();
  const [variantId, setVariantId] = useState('');
  const [added, setAdded] = useState(false);
  const variants = product.variants?.nodes ?? [];
  const selected = variants.find(v => v.id === variantId) ?? variants.find(v => v.availableForSale) ?? variants[0];
  const price = selected?.price ?? product.priceRange.minVariantPrice;
  return <section className="page-width standalone-section product-detail"><h1>{product.title}</h1><div className="product-grid">{product.images.nodes.map(image => <img key={image.url} src={image.url} alt={image.altText ?? product.title} />)}</div><p>{product.description}</p><p>{new Intl.NumberFormat(ar ? 'ar-EG' : 'en-EG', { style: 'currency', currency: price.currencyCode }).format(Number(price.amount))}</p>{variants.length > 1 && <label className="product-variant-label">{ar ? 'اختار المقاس / التصميم' : 'Size / style'}<select value={selected?.id ?? ''} onChange={e => { setVariantId(e.target.value); setAdded(false); }}>{variants.map(v => <option value={v.id} key={v.id} disabled={!v.availableForSale}>{v.title}{!v.availableForSale ? ar ? ' — غير متاح' : ' — Unavailable' : ''}</option>)}</select></label>}<Button variant="ink" disabled={busy || !selected?.availableForSale} onClick={async () => { if (selected) setAdded(await addItem(selected.id)); }}>{busy ? <Loader2 className="animate-spin" /> : <ShoppingBag />}{ar ? selected?.availableForSale ? 'ضيف للشنطة' : 'غير متاح حاليًا' : selected?.availableForSale ? 'ADD TO BAG' : 'CURRENTLY UNAVAILABLE'}</Button>{error && <p className="note-red" role="alert">{ar ? 'مقدرناش نضيف المنتج. جرّب تاني.' : 'Couldn’t add this item. Please try again.'}</p>}{added && <p role="status">{ar ? 'اتضاف للشنطة.' : 'Added to your bag.'}</p>}<Button variant="note" asChild><Link to="/cart">{ar ? 'شوف الشنطة' : 'VIEW YOUR BAG'}<ArrowUpRight /></Link></Button></section>;
}