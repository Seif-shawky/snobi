import { createFileRoute, Link } from '@tanstack/react-router';
import { useLanguage } from '@/components/snobi';
import { CartPanel } from '@/components/cart-panel';

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [
    { title: 'Your Bag — Snobi' },
    { name: 'description', content: 'Your Snobi bag. Review your clothing, quantities and subtotal before secure checkout.' },
    { property: 'og:title', content: 'Your Bag — Snobi' },
    { property: 'og:description', content: 'Clothes for you. A chance for Snobi. Review your bag here.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: CartPage,
});
function CartPage() {
  const { ar } = useLanguage();
  return <section className="cart-page page-width"><div className="shop-breadcrumb"><Link to="/">{ar ? 'الرئيسية' : 'HOME'}</Link> / {ar ? 'الشنطة' : 'YOUR BAG'}</div><div className="cart-page-heading"><div><span className="section-kicker">{ar ? 'هدوم ليك. أمل لسنوبي.' : 'CLOTHES FOR YOU. HOPE FOR SNOBI.'}</span><h1>{ar ? 'شنطتك.' : 'YOUR BAG.'}</h1></div><span className="handwriting">{ar ? 'هو بيحاول ميستعجلكش.' : 'he’s trying not to rush you.'}</span></div><CartPanel ar={ar} /><div className="cart-page-note"><p>{ar ? 'تصميمات الهدوم المعروضة لسه مش متاحة للطلب. الأسعار والمقاسات لسه مش مؤكدة.' : 'Clothing design previews aren’t available to order yet. Prices and sizes are still to be confirmed.'}</p><p>{ar ? 'شراء الهدوم بيدعم حكاية سنوبي الخيالية. مش تبرع خيري معفى من الضرائب.' : 'Clothing purchases support Snobi’s fictional story. Not a tax-deductible charity donation.'}</p></div></section>;
}