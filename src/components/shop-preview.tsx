import { useState } from 'react';
import { ArrowUpRight, Plus, Asterisk } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLanguage } from '@/components/snobi';
import knit from '@/assets/snobi-knit-mockup.jpg.asset.json';
import dayOne from '@/assets/snobi-day-one-mockup.jpg.asset.json';
import backPrint from '@/assets/snobi-back-print-mockup.jpg.asset.json';

const looks = [
  { image: backPrint.url, title: 'THE BIG SNOBI', arabic: 'سنوبي الكبير', detail: 'The back-print idea.', arabicDetail: 'فكرة الرسمة على الضهر.', note: 'a big dog. a small bank balance.', arabicNote: 'كلب كبير. رصيد صغير.', alt: 'Clothing mockup: dark oversized sweatshirt with a large gold Snobi back print' },
  { image: dayOne.url, title: 'DAY ONE', arabic: 'أول يوم', detail: 'The blue sweatshirt idea.', arabicDetail: 'فكرة السويت شيرت الأزرق.', note: 'you were here before he had anything.', arabicNote: 'إنت هنا من قبل ما يبقى عنده حاجة.', alt: 'Clothing mockup: blue sweatshirt with white Snobi day one lettering across the back and sleeves' },
  { image: knit.url, title: 'SNOBI IN KNIT', arabic: 'سنوبي تريكو', detail: 'The knitted mascot idea.', arabicDetail: 'فكرة سنوبي على التريكو.', note: 'at least one of you will be warm.', arabicNote: 'على الأقل واحد فيكم هيدفى.', alt: 'Clothing mockup: dark knit sweater with a large cream Snobi mascot on the front' },
];

export function ShopPreview() {
  const { ar } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const look = selected === null ? undefined : looks[selected];
  return <>
    <section className="shop-intro page-width">
      <div className="shop-breadcrumb">{ar ? 'سنوبي / التيشيرتات والهدوم' : 'SNOBI / THE CLOTHES'}</div>
      <div className="shop-intro-heading"><div><span className="phase-label">{ar ? 'المرحلة ٠' : 'PHASE 0'}</span><h1>{ar ? <>سنوبي محتاج<br /><span className="broke-word">فلوس.</span></> : <>SNOBI NEEDS<br /><span className="broke-word">MONEY.</span></>}</h1></div><div className="shop-intro-note"><p className="handwriting">{ar ? 'هو معندوش كتير يقدمه.\nبس عنده أفكار للهدوم.' : 'he doesn’t have much to offer.\nbut he does have clothing ideas.'}</p><svg viewBox="0 0 130 65" aria-hidden="true"><path d="M10 10 Q110 0 95 55 M80 40 L95 57 L112 42" /></svg></div></div>
      <div className="shop-intro-bottom"><p>{ar ? 'إنت تدعمه. إنت تاخد هدوم. هو يقرب خطوة من إنه يبطل يكون مفلس.' : 'You help him. You get clothes. He gets a little closer to not being broke.'}</p><span className="handwriting">{ar ? 'صفقة غريبة. هدوم حلوة.' : 'strange arrangement. good clothes.'}</span></div>
    </section>
    <section className="shop-lookbook page-width" aria-label={ar ? 'معاينة أفكار الهدوم' : 'Clothing design previews'}>
      <div className="lookbook-heading"><div><Asterisk aria-hidden="true" /><h2>{ar ? 'أول محاولة.' : 'THE FIRST ATTEMPT.'}</h2></div><span className="preview-stamp">{ar ? 'معاينة التصميمات' : 'DESIGN PREVIEWS'}</span></div>
      <p className="lookbook-disclosure">{ar ? 'دي صور مبدئية لأفكار الهدوم، مش منتجات متاحة للطلب. التصميمات النهائية والأسعار بالجنيه والمقاسات لسه هتتأكد.' : 'Clothing mockups, not items available to order. Final designs, EGP prices, and sizes are still to be confirmed.'}</p>
      <div className="lookbook-grid">{looks.map((item, index) => <article className="lookbook-item" key={item.title}>
        <Button variant="ghost" className="lookbook-image-button" aria-label={ar ? `كبّر صورة ${item.arabic}` : `Enlarge ${item.title} mockup`} onClick={() => setSelected(index)}><img src={item.image} alt={item.alt} loading="eager" /><span className="look-number">0{index + 1}</span><span className="look-zoom"><Plus aria-hidden="true" /></span></Button>
        <div className="look-title"><h3>{ar ? item.arabic : item.title}</h3><span>{ar ? 'تصميم مبدئي' : 'MOCKUP'}</span></div><p className="look-detail">{ar ? item.arabicDetail : item.detail}</p><p className="look-note handwriting">{ar ? item.arabicNote : item.note}</p>
        <div className="look-status"><span>{ar ? 'السعر والمقاسات لسه هيتأكدوا' : 'Price & sizes to be confirmed'}</span><Button variant="note" onClick={() => setSelected(index)} aria-label={ar ? `شوف تصميم ${item.arabic}` : `View ${item.title} design`}>{ar ? 'شوف التصميم' : 'VIEW DESIGN'}<ArrowUpRight /></Button></div>
      </article>)}</div>
    </section>
    <section className="shop-arrangement"><div className="page-width"><Asterisk aria-hidden="true" /><div><h2>{ar ? 'هدوم ليك. أمل لسنوبي.' : 'CLOTHES FOR YOU. HOPE FOR SNOBI.'}</h2><p>{ar ? 'الدفع مقابل قطعة الهدوم الموضحة ودعم حكاية سنوبي الخيالية. مش تبرع لجمعية خيرية.' : 'Your payment covers the stated clothing item and supports Snobi’s fictional story. This is not a charitable donation.'}</p></div><span className="handwriting">{ar ? 'هو شايفها خطة كويسة.' : 'he thinks this is a solid plan.'}</span></div></section>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="lookbook-dialog" dir={ar ? 'rtl' : 'ltr'}><DialogTitle>{look ? ar ? look.arabic : look.title : ''}</DialogTitle><DialogDescription>{ar ? 'تصميم مبدئي. الأسعار والمقاسات لسه هيتأكدوا.' : 'Design preview. Prices and sizes are not confirmed yet.'}</DialogDescription>{look && <img className="lookbook-enlarged" src={look.image} alt={look.alt} />}</DialogContent></Dialog>
  </>;
}