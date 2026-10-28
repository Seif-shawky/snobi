import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Mascot, useLanguage } from "@/components/snobi";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Questions. Unfortunately. — Snobi FAQ" },
      {
        name: "description",
        content:
          "Honest answers about Snobi: clothes, sizes, cash on delivery, delivery fees by governorate, 14-day returns, contact and privacy.",
      },
      { property: "og:title", content: "Questions. Unfortunately. — Snobi FAQ" },
      {
        property: "og:description",
        content: "Your questions about a broke dog and his first collection, answered honestly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

type FaqLink = "/supporters" | "/shipping" | "/contact" | "/privacy" | "/terms";
interface Faq {
  q: string;
  a: string;
  link?: { to: FaqLink; label: string };
}

function FaqPage() {
  const { ar } = useLanguage();
  const questions: Faq[] = ar
    ? [
        {
          q: "مين سنوبي؟",
          a: "سنوبي كلب مرسوم، بطموحات كبيرة وجيوب فاضية، ووش براند ملابس مصري. دي المرحلة ٠: لسه مفلس ولسه في البداية.",
        },
        {
          q: "إيه اللي بيحصل لما أساعد سنوبي؟",
          a: "شراء الهدوم بيساعد حكاية سنوبي الخيالية تكمل. إنت بتشتري المنتج بالسعر الموضح، مش حصة في البراند أو استثمار. ده مش تبرع خيري.",
          link: { to: "/terms", label: "الشروط والأحكام" },
        },
        {
          q: "هاخد تيشيرت؟",
          a: "أيوه. طلبك هو قطعة الهدوم اللي اخترتها بالمقاس اللي اخترته. صور كل منتج بتوضح القطعة الحقيقية.",
        },
        {
          q: "أنا بدفع مقابل إيه بالظبط؟",
          a: "تمن المنتجات بالسعر الموضح، زائد مصاريف التوصيل لمحافظتك. الإجمالي بيظهر في صفحة إتمام الطلب قبل ما تأكد. مفيش رسوم تانية.",
        },
        {
          q: "أختار مقاسي إزاي؟",
          a: "اختار من المقاسات المعروضة في صفحة المنتج. دليل القياسات لسه مش منشور؛ لو مش متأكد، ابعتلنا قبل ما تطلب.",
          link: { to: "/contact", label: "اسألنا عن المقاس" },
        },
        {
          q: "التوصيل بكام؟",
          a: "حسب المحافظة. مصاريف التوصيل بتظهر في صفحة إتمام الطلب قبل ما تأكد الطلب، ومش بتترد في حالة الاسترجاع.",
          link: { to: "/shipping", label: "الشحن والاسترجاع" },
        },
        {
          q: "إيه طرق الدفع المتاحة؟",
          a: "كاش عند الاستلام بس. مش بتدفع حاجة على الموقع، ومش بنطلب بيانات كارت أبدًا.",
        },
        {
          q: "ممكن أبدّل أو أرجّع القطعة؟",
          a: "أيوه، خلال ١٤ يوم من الاستلام. مصاريف التوصيل مش بتترد. الشروط كاملة في صفحة الشحن والاسترجاع، وده مش بيلغي أي حقوق قانونية ليك.",
          link: { to: "/shipping", label: "شروط الاسترجاع" },
        },
        {
          q: "التوصيل بياخد قد إيه؟",
          a: "حسب المحافظة. لو فيه مدة متوقعة لمحافظتك هتلاقيها في صفحة إتمام الطلب، وبنأكد الميعاد معاك لما نكلمك نأكد الطلب.",
        },
        {
          q: "أول مجموعة هترجع تاني؟",
          a: "مفيش قرار لسه. الكميات محدودة، ومش هنقول «آخر فرصة» من غير سبب حقيقي. تابع @snobi.isbroke على إنستجرام.",
        },
        {
          q: "ممكن أفضل مجهول في صفحة الداعمين؟",
          a: "الظهور العام اختياري: اسم تختاره، أو ظهور مجهول، أو عدم الظهور. حاليًا إعدادات الملف مجرد معاينة مؤقتة؛ مش بتسجل اختيارك ومش بتنشره، ومفيش ملفات عامة متاحة لسه.",
          link: { to: "/supporters", label: "صفحة الداعمين" },
        },
        {
          q: "أتواصل مع البراند إزاي؟",
          a: "من نموذج التواصل، أو على الإيميل seifwork006@gmail.com، أو على إنستجرام @snobi.isbroke. بني آدم هيرد. مش الكلب.",
          link: { to: "/contact", label: "تواصل معانا" },
        },
        {
          q: "بتعملوا إيه ببياناتي؟",
          a: "بنستخدمها عشان نوصّل طلبك ونرد عليك بس. مفيش أدوات تتبّع ولا إعلانات، ومش بنبيع بياناتك.",
          link: { to: "/privacy", label: "سياسة الخصوصية" },
        },
      ]
    : [
        {
          q: "Who is Snobi?",
          a: "Snobi is a doodle of a dog with big ambitions and empty pockets, and the face of an Egyptian clothing brand. This is Phase 0: still broke, still at the beginning.",
        },
        {
          q: "What happens when I help Snobi?",
          a: "Buying clothes helps Snobi’s fictional story continue. You’re buying the item at its displayed price, not a stake in the brand or an investment. It is not a charity donation.",
          link: { to: "/terms", label: "READ THE TERMS" },
        },
        {
          q: "Do I receive a T-shirt?",
          a: "Yes. Your order is the clothing item you choose, in the size you pick. The photos on each product page show the real item.",
        },
        {
          q: "What exactly am I paying for?",
          a: "The items at their displayed prices, plus the delivery fee for your governorate. The total is shown at checkout before you confirm. No other charges.",
        },
        {
          q: "How do I choose my size?",
          a: "Pick from the sizes on the product page. A measurement guide isn’t published yet; if you’re unsure, message us before ordering.",
          link: { to: "/contact", label: "ASK ABOUT SIZING" },
        },
        {
          q: "How much is delivery?",
          a: "It depends on your governorate. The delivery fee is shown at checkout before you place your order, and it isn’t refunded if you return an item.",
          link: { to: "/shipping", label: "SHIPPING & RETURNS" },
        },
        {
          q: "Which payment methods are available?",
          a: "Cash on delivery only. You pay nothing on the website and we never ask for card details.",
        },
        {
          q: "Can I exchange or return my shirt?",
          a: "Yes, within 14 days of delivery. Delivery fees are not refundable. The full conditions are on the shipping & returns page, and none of this removes your statutory rights.",
          link: { to: "/shipping", label: "RETURN CONDITIONS" },
        },
        {
          q: "How long does delivery take?",
          a: "It depends on your governorate. If there’s an estimate for yours, you’ll see it at checkout, and we confirm timing when we call to confirm your order.",
        },
        {
          q: "Will the first collection return?",
          a: "No decision yet. Stock is limited, and we won’t call it your “last chance” without a real reason. Follow @snobi.isbroke on Instagram.",
        },
        {
          q: "Can I remain anonymous on the supporters page?",
          a: "Public display is optional: a name you choose, anonymous display, or no public appearance. Profile settings are currently temporary previews only; they do not save consent or publish anything. Public profiles are not open yet.",
          link: { to: "/supporters", label: "VISIT THE SUPPORTERS PAGE" },
        },
        {
          q: "How do I contact the brand?",
          a: "Use the contact form, email seifwork006@gmail.com, or find us on Instagram at @snobi.isbroke. A human answers. Not the dog.",
          link: { to: "/contact", label: "CONTACT SNOBI" },
        },
        {
          q: "What do you do with my data?",
          a: "We use it to deliver your order and reply to you. No trackers, no ads, and we never sell your data.",
          link: { to: "/privacy", label: "PRIVACY POLICY" },
        },
      ];
  return (
    <>
      <section className="faq-intro page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {ar ? "الأسئلة الشائعة" : "FAQ"}
          </span>
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
        </div>
        <div className="faq-title">
          <span className="section-kicker">
            {ar ? "أسئلة منطقية عن كلب مش منطقي." : "REASONABLE QUESTIONS. UNREASONABLE DOG."}
          </span>
          <h1>
            {ar ? (
              <>
                عندك أسئلة.
                <br />
                للأسف.
              </>
            ) : (
              <>
                YOU HAVE QUESTIONS.
                <br />
                UNFORTUNATELY.
              </>
            )}
          </h1>
          <p className="handwriting">
            {ar ? "هو كمان عنده. أغلبها عن الفلوس." : "so does he. mostly about money."}
          </p>
        </div>
      </section>
      <section
        className="faq-answers page-width"
        aria-label={ar ? "الأسئلة الشائعة" : "Frequently asked questions"}
      >
        <div className="faq-topline">
          <span>
            {ar
              ? `${questions.length.toLocaleString("ar-EG")} سؤال · إجابات صريحة`
              : `${questions.length} QUESTIONS · HONEST ANSWERS`}
          </span>
          <p>
            {ar ? "لو حاجة لسه مش متقررة، هنقول." : "If something isn’t decided yet, we’ll say so."}
          </p>
        </div>
        <Accordion type="single" collapsible defaultValue="question-0" className="faq-accordion">
          {questions.map(({ q, a, link }, i) => (
            <AccordionItem value={`question-${i}`} key={q}>
              <AccordionTrigger className="faq-question">
                <span className="faq-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{q}</span>
              </AccordionTrigger>
              <AccordionContent className="faq-answer">
                <p>{a}</p>
                {link && (
                  <Button variant="note" asChild>
                    <Link to={link.to}>
                      {link.label}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <section className="faq-outro-band">
        <div className="page-width faq-outro">
          <Mascot className="faq-mascot" />
          <div>
            <h2>{ar ? "دلوقتي عارف قد اللي نعرفه." : "NOW YOU KNOW AS MUCH AS WE DO."}</h2>
            <p className="handwriting">
              {ar ? "وده مش كتير. بس بداية." : "which is not much. but it’s a start."}
            </p>
            <Button variant="note" asChild>
              <Link to="/shop">
                {ar ? "ارجع للتيشيرتات" : "BACK TO THE SHOP"}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
