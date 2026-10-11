import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Link, useHydrated } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUpRight, Menu, ShoppingBag, X, Heart, Shirt, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import mascot from '@/assets/snobi-original.png.asset.json';
import { productsQuery } from '@/lib/shopify';
import { useCartStore } from '@/stores/cart';
import { CartPanel } from '@/components/cart-panel';

const LanguageContext = createContext({ ar: false, toggle: () => {} });
export const useLanguage = () => useContext(LanguageContext);

export function SnobiShell({ children }: { children: ReactNode }) {
  const [ar, setAr] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bag, setBag] = useState(false);
  const hydrated = useHydrated();
  const quantity = useCartStore(s => s.cart?.totalQuantity ?? 0);
  const syncCart = useCartStore(s => s.syncCart);
  useEffect(() => {
    let mounted = true;
    void Promise.resolve(useCartStore.persist.rehydrate()).then(() => { if (mounted) void syncCart(); }).catch(() => {});
    const onVisible = () => { if (document.visibilityState === 'visible') void syncCart(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { mounted = false; document.removeEventListener('visibilitychange', onVisible); };
  }, [syncCart]);
  const count = hydrated ? quantity : 0;
  return <LanguageContext.Provider value={{ ar, toggle: () => setAr(v => !v) }}>
    <div className="snobi-site" dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'en'}>
      <div className="announcement">{ar ? 'المرحلة ٠: لسه مفلس. للأسف.' : 'PHASE 0: STILL BROKE. UNFORTUNATELY.'}<span className="announcement-dot" />{ar ? 'صُنع في مصر' : 'MADE IN EGYPT'}</div>
      <header className="site-header page-width">
        <Link to="/" className="wordmark" aria-label="Snobi home">snobi<span className="wordmark-dot">.</span></Link>
        <nav className="desktop-nav" aria-label={ar ? 'القائمة الرئيسية' : 'Main navigation'}>
          <Link to="/" activeProps={{ className: 'active' }} activeOptions={{ exact: true }}>{ar ? 'الرئيسية' : 'Home'}</Link>
          <Link to="/shop" activeProps={{ className: 'active' }}>{ar ? 'التيشيرتات' : 'Shop'}</Link>
          <Link to="/story" activeProps={{ className: 'active' }}>{ar ? 'حكاية سنوبي' : "Snobi’s story"}</Link>
          <Link to="/supporters" activeProps={{ className: 'active' }}>{ar ? 'الداعمين' : 'Supporters'}</Link>
        </nav>
        <div className="header-actions">
          <Button variant="ghost" className="language-button" onClick={() => setAr(v => !v)} aria-label={ar ? 'Switch to English' : 'التبديل للعربية'}><span className={!ar ? 'language-active' : ''}>EN</span><span className="language-divider">/</span><span className={ar ? 'language-active' : ''}>AR</span></Button>
          <Button variant="ghost" className="bag-button" onClick={() => { setBag(true); void syncCart(); }} aria-label={ar ? `افتح الشنطة، ${count} منتجات` : `Open bag, ${count} items`}><ShoppingBag /><span>{count}</span></Button>
          <Button variant="ghost" size="icon" className="mobile-menu-button" onClick={() => setMenu(v => !v)} aria-label="Toggle menu" aria-expanded={menu}>{menu ? <X /> : <Menu />}</Button>
        </div>
      </header>
      {menu && <nav className="mobile-nav page-width" aria-label="Mobile navigation" onClick={() => setMenu(false)}><Link to="/">{ar ? 'الرئيسية' : 'Home'}</Link><Link to="/shop">{ar ? 'التيشيرتات' : 'Shop'}</Link><Link to="/story">{ar ? 'حكاية سنوبي' : "Snobi’s story"}</Link><Link to="/supporters">{ar ? 'الداعمين' : 'Supporters'}</Link></nav>}
      <main>{children}</main>
      <footer className="site-footer page-width"><div><Link to="/" className="wordmark">snobi.</Link><p className="handwriting">{ar ? 'ارجع تاني. أرجوك.' : 'please come back.'}</p></div><div className="footer-links"><Link to="/shop">{ar ? 'التيشيرتات' : 'Shop'}</Link><Link to="/story">{ar ? 'عن سنوبي' : 'About Snobi'}</Link><Link to="/supporters">{ar ? 'الداعمين' : 'Supporters'}</Link></div><div className="footer-fine">{ar ? 'سنوبي © ٢٠٢٦ · صُنع في مصر' : '© 2026 SNOBI. MADE IN EGYPT.'}<p>{ar ? 'كل ده عشان كلب مرسوم.' : 'all this for a doodle of a dog.'}</p></div></footer>
      <Dialog open={bag} onOpenChange={setBag}><DialogContent className="cart-dialog" dir={ar ? 'rtl' : 'ltr'}><DialogTitle>{ar ? 'شنطتك.' : 'YOUR BAG.'}</DialogTitle><DialogDescription>{ar ? `${count} منتجات. سنوبي بيستنى.` : `${count} items. Snobi is waiting.`}</DialogDescription><CartPanel ar={ar} compact onNavigate={() => setBag(false)} /><Button variant="note" asChild onClick={() => setBag(false)}><Link to="/cart">{ar ? 'افتح صفحة الشنطة' : 'VIEW FULL BAG'}<ArrowUpRight /></Link></Button></DialogContent></Dialog>
    </div>
  </LanguageContext.Provider>;
}

export function Mascot({ className = '' }: { className?: string }) {
  return <img className={`mascot ${className}`} src={mascot.url} alt="Snobi, the original hand-drawn dog with absolutely no money" />;
}

export function Collection({ standalone = false }: { standalone?: boolean }) {
  const { ar } = useLanguage();
  const { data } = useSuspenseQuery(productsQuery);
  return <section id="collection" className={`collection page-width ${standalone ? 'standalone-section' : ''}`}>
    <div className="section-kicker"><span>01 / {ar ? 'أول مجموعة' : 'THE FIRST DROP'}</span><span className="handwriting">{ar ? 'بداية متواضعة جدًا' : 'a very humble beginning'}</span></div>
    <div className="section-heading"><h2>{ar ? 'أول محاولة لسنوبي\nعشان يعمل فلوس.' : "SNOBI’S FIRST ATTEMPT\nAT MAKING MONEY."}</h2><p className="handwriting">{ar ? 'تيشيرتات محدودة. مشاكل مالية بلا حدود.' : 'limited shirts. unlimited financial problems.'}</p></div>
    {data.products.nodes.length === 0 ? <div className="collection-empty"><Shirt aria-hidden="true" /><div><h3>{ar ? 'التيشيرتات لسه في السكة.' : 'THE SHIRTS ARE STILL IN THE WORKS.'}</h3><p>{ar ? 'مفيش منتجات لسه. سنوبي بيحاول يظبط أموره.' : 'No products found. Snobi is getting his act together.'}</p></div><span className="handwriting">{ar ? 'أول بيزنس ليه. واضح يعني.' : 'his first business. it shows.'}</span></div> : <div className="product-grid">{data.products.nodes.map(product => <Link to="/product/$handle" params={{ handle: product.handle }} className="product-item" key={product.id}>{product.images.nodes[0] && <img src={product.images.nodes[0].url} alt={product.images.nodes[0].altText ?? product.title} />}<h3>{product.title}</h3><p>{new Intl.NumberFormat(ar ? 'ar-EG' : 'en-EG', { style: 'currency', currency: product.priceRange.minVariantPrice.currencyCode }).format(Number(product.priceRange.minVariantPrice.amount))}</p><span className="product-link">{ar ? 'شوف التيشيرت' : 'VIEW SHIRT'}<ArrowUpRight /></span></Link>)}</div>}
    <p className="purchase-note">{ar ? 'شراء تيشيرت بيدعم حكاية سنوبي الخيالية. مش تبرع لجمعية خيرية.' : 'You’re buying a T-shirt and supporting a fictional dog. Not a charity. Just Snobi.'}</p>
  </section>;
}

export function HowItWorks() {
  const { ar } = useLanguage();
  const steps = ar ? [['ساعد سنوبي', 'اختار تيشيرت وادفع السعر الموضح.'], ['خُد تيشيرت', 'إنت تاخد التيشيرت اللي اخترته. هو ياخد الفلوس.'], ['غيّر حياته', 'كل عملية شراء مؤهلة بتساعد حكايته تكمل.']] : [['HELP SNOBI', 'Pick a shirt. Pay the displayed price.'], ['GET A SHIRT', 'You get your chosen T-shirt. He gets the money.'], ['CHANGE HIS LIFE', 'Eligible purchases help his story move forward.']];
  const icons = [Heart, Shirt, Sparkles];
  return <section className="how-section"><div className="page-width"><div className="section-kicker"><span>02 / {ar ? 'الخطة' : 'THE BUSINESS PLAN'}</span></div><div className="how-title"><h2>{ar ? 'الموضوع بسيط.' : 'A VERY SIMPLE ARRANGEMENT.'}</h2><span className="handwriting">{ar ? 'مفيش خطة عمل فعلًا.' : 'we have absolutely no business plan.'}</span></div><div className="steps">{steps.map(([title, text], i) => { const Icon = icons[i]; return <div className="step" key={title}><div className="step-top"><span className="step-number">0{i + 1}</span>{Icon && <Icon strokeWidth={1.4} aria-hidden="true" />}</div><h3>{title}</h3><p>{text}</p></div>; })}</div><p className="handwriting waste-note">{ar ? 'غالبًا هيضيّعهم.' : 'he will probably waste it.'}<ArrowDown aria-hidden="true" /></p></div></section>;
}

export function Supporters({ standalone = false }: { standalone?: boolean }) {
  const { ar } = useLanguage();
  return <section className={`supporters-section page-width ${standalone ? 'standalone-section' : ''}`}><div className="section-kicker"><span>03 / {ar ? 'المتواطئين' : 'THE ENABLERS'}</span></div><div className="section-heading"><h2>{ar ? 'الناس اللي بتشجّع سنوبي.' : 'PEOPLE WHO ENABLE SNOBI.'}</h2><p className="handwriting">{ar ? 'سنوبي مستني.' : 'questionable decisions. good people.'}</p></div><div className="supporter-empty"><Heart strokeWidth={1.3} aria-hidden="true" /><p>{ar ? 'محدش ساعده لسه.' : 'nobody has enabled him yet.'}</p><span>{ar ? 'الدعم المؤكد هيظهر هنا لما يبقى متاح.' : 'Verified support will appear here when available.'}</span></div>{!standalone && <Button variant="note" asChild><Link to="/supporters">{ar ? 'شوف الداعمين' : 'MEET THE ENABLERS'}<ArrowUpRight /></Link></Button>}</section>;
}

export function StoryTeaser({ standalone = false }: { standalone?: boolean }) {
  const { ar } = useLanguage();
  return <section className={`story-section ${standalone ? 'standalone-section' : ''}`}><div className="page-width story-layout"><div className="story-copy"><span className="section-kicker">04 / {ar ? 'السؤال المهم' : 'THE IMPORTANT QUESTION'}</span><h2>{ar ? 'الفلوس بتروح فين؟' : 'WHERE DOES\nTHE MONEY GO?'}</h2><p>{ar ? 'كلب مفلس قرر إن طلب فلوس من الناس أسهل من إنه يظبط حياته.' : 'A broke dog decided that asking strangers for money was easier than getting his life together.'}</p><Button variant="note" asChild><Link to="/story">{ar ? 'حكاية سنوبي الحزينة' : standalone ? 'BACK TO THE BEGINNING' : 'SNOBI’S SAD FINANCIAL HISTORY'}<ArrowUpRight /></Link></Button></div><div className="expense-art"><Mascot className="expense-mascot" /><div className="expense-note"><p className="handwriting expense-title">{ar ? 'أولويات سنوبي المالية' : "snobi’s financial priorities"}</p><div><span>{ar ? 'الأكل' : 'food'}</span><span>{ar ? 'أكتر من اللازم غالبًا' : 'probably too much'}</span></div><div><span>{ar ? 'المدخرات' : 'savings'}</span><span>{ar ? 'مدخرات إيه؟' : 'what savings'}</span></div><div><span>{ar ? 'التخطيط المالي' : 'financial planning'}</span><span className="note-red">{ar ? 'لا' : 'no'}</span></div><p className="expense-disclaimer">{ar ? 'دي نكتة في الحكاية. مش حسابات فعلية.' : 'Fictional dog expenses. Not business accounting.'}</p></div></div></div></section>;
}