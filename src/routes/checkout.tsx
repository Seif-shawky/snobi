import { createFileRoute, Link } from '@tanstack/react-router';
import { useLanguage } from '@/components/snobi';
import { CartPanel } from '@/components/cart-panel';

export const Route = createFileRoute('/checkout')({
  head: () => ({ meta: [
    { title: 'Checkout — Snobi' },
    { name: 'description', content: 'Review your Snobi bag, then pay securely through Shopify checkout.' },
    { property: 'og:title', content: 'Checkout — Snobi' },
    { property: 'og:description', content: 'One last look before Snobi’s questionable business makes a sale.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { ar } = useLanguage();
  return <section className="cart-page page-width">
    <div className="shop-breadcrumb"><Link to="/">{ar ? 'الرئيسية' : 'HOME'}</Link> / <Link to="/cart">{ar ? 'الشنطة' : 'BAG'}</Link> / {ar ? 'الدفع' : 'CHECKOUT'}</div>
    <div className="cart-page-heading"><div><span className="section-kicker">{ar ? 'خطوة أخيرة. سنوبي متوتر.' : 'LAST STEP. SNOBI IS NERVOUS.'}</span><h1>{ar ? 'راجع وادفع.' : 'REVIEW & PAY.'}</h1></div><span className="handwriting">{ar ? 'الدفع بيتم بأمان عن طريق Shopify.' : 'payment happens safely on Shopify.'}</span></div>
    <CartPanel ar={ar} review />
    <div className="cart-page-note"><p>{ar ? 'هتفتح صفحة دفع Shopify في تاب جديدة. العنوان والشحن والدفع بيتحددوا هناك.' : 'Shopify’s secure payment page opens in a new tab. Address, shipping and payment are entered there.'}</p><p>{ar ? 'شراء الهدوم بيدعم حكاية سنوبي الخيالية. مش تبرع خيري معفى من الضرائب.' : 'Clothing purchases support Snobi’s fictional story. Not a tax-deductible charity donation.'}</p></div>
  </section>;
}
