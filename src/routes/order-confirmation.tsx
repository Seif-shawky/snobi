import { useEffect, useState } from 'react';
import { createFileRoute, Link, useHydrated } from '@tanstack/react-router';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/snobi';
import { useCartStore } from '@/stores/cart';
import mascot from '@/assets/snobi-original.png.asset.json';

export const Route = createFileRoute('/order-confirmation')({
  head: () => ({ meta: [
    { title: 'Order Confirmation — Snobi' },
    { name: 'description', content: 'Thanks for giving Snobi a chance. Your Shopify receipt arrives by email.' },
    { property: 'og:title', content: 'Order Confirmation — Snobi' },
    { property: 'og:description', content: 'Snobi got a sale. He is pretending to be calm about it.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { ar } = useLanguage();
  const hydrated = useHydrated();
  const { cart, busy, syncCart } = useCartStore();
  const [checked, setChecked] = useState(false);
  const check = () => { void syncCart().finally(() => setChecked(true)); };
  useEffect(() => {
    check();
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);
  const pending = !hydrated || !checked;
  const done = !pending && !cart;
  return <section className="cart-page page-width confirm-page">
    <div className="cart-empty">
      <span className="section-kicker">{ar ? 'تأكيد الطلب' : 'ORDER CONFIRMATION'}</span>
      <img className="mascot cart-mascot" src={mascot.url} alt={ar ? 'سنوبي، كلب مرسوم' : 'Snobi, the original doodle of a dog'} />
      {pending ? <p><Loader2 className="animate-spin" aria-hidden="true" /> {ar ? 'بنتأكد من طلبك…' : 'Checking your order…'}</p>
      : done ? <>
        <h1>{ar ? 'شكرًا.\nسنوبي مصدّقش.' : 'THANK YOU.\nSNOBI CAN’T BELIEVE IT.'}</h1>
        <p>{ar ? 'لو كملت الدفع، Shopify هيبعتلك إيميل فيه رقم الطلب والإيصال وتفاصيل الشحن.' : 'If you completed payment, Shopify will email your order number, receipt and shipping details.'}</p>
        <Button variant="ink" asChild><Link to="/story">{ar ? 'اقرا حكايته' : 'READ HIS STORY'}<ArrowUpRight /></Link></Button>
        <span className="handwriting">{ar ? 'أول بيعة. هيتبروز.' : 'first sale. he’s getting it framed.'}</span>
      </> : <>
        <h1>{ar ? 'الدفع لسه ما خلصش.' : 'PAYMENT NOT FINISHED YET.'}</h1>
        <p>{ar ? 'شنطتك لسه موجودة. كمّل الدفع في تاب Shopify، وارجع هنا.' : 'Your bag is still here. Finish paying in the Shopify tab, then come back.'}</p>
        <Button variant="ink" disabled={busy} onClick={check}>{ar ? 'اتأكد تاني' : 'CHECK AGAIN'}</Button>
        <Button variant="note" asChild><Link to="/checkout">{ar ? 'ارجع للدفع' : 'BACK TO CHECKOUT'}<ArrowUpRight /></Link></Button>
      </>}
    </div>
  </section>;
}
