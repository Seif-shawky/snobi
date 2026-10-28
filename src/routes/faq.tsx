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
          "Honest answers about Snobi, clothing, sizes, payments, delivery and supporter privacy. Phase 0: a beginning, not a promise.",
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

function FaqPage() {
  const { ar } = useLanguage();
  const questions = ar
    ? [
        [
          "مين سنوبي؟",
          "سنوبي كلب مرسوم، بطموحات كبيرة وجيوب فاضية، ووش براند ملابس مصري. دي المرحلة ٠: لسه مفلس ولسه في البداية.",
        ],
        [
          "إيه اللي بيحصل لما أساعد سنوبي؟",
          "لما المنتجات تبقى متاحة، شراء الملابس بيساعد حكاية سنوبي الخيالية تكمل. إنت بتشتري المنتج الموضح، مش حصة في البراند أو عائد استثمار. ده مش تبرع خيري معفى من الضرائب.",
        ],
        [
          "هاخد تيشيرت؟",
          "الطلب بيشمل قطعة الملابس اللي تختارها من المنتجات المتاحة. الصور الحالية معاينات تصميمات، مش منتجات مؤكدة للطلب. تفاصيل المنتج النهائي والأسعار والمقاسات لسه مش مؤكدة.",
        ],
        [
          "أنا بدفع مقابل إيه بالظبط؟",
          "مقابل المنتج اللي اخترته بالسعر الموضح، زائد مصاريف التوصيل اللي هنأكدها معاك بالتليفون قبل الشحن. معاينات التصميمات مش للبيع؛ مفيش دفع مقابل معاينة تصميم.",
        ],
        [
          "أختار مقاسي إزاي؟",
          "المقاسات ودليل القياسات لسه مش مؤكدين. لما المنتج يبقى متاح، اختار من المقاسات المعروضة في صفحته وراجع دليل القياسات لو متاح. متعتمدش على صورة الموكاب لتحديد المقاس.",
        ],
        [
          "التوصيل بكام؟",
          "مناطق التوصيل ورسومه لسه مش مؤكدة. مفيش سعر ثابت أو وعد بتوصيل مجاني دلوقتي. بعد ما تطلب، هنكلمك أو نبعتلك واتساب نقولك مصاريف التوصيل قبل الشحن، ولو مش مناسبة ليك مش هنشحن.",
        ],
        [
          "إيه طرق الدفع المتاحة؟",
          "دلوقتي الدفع كاش عند الاستلام بس. مش بتدفع حاجة على الموقع، ومش بنطلب بيانات كارت. لو طرق دفع تانية اتضافت، هنقول هنا.",
        ],
        [
          "ممكن أبدّل أو أرجّع القطعة؟",
          "سياسة الاستبدال والاسترجاع لسه مش منشورة. مش هنخترع مدة أو شروط. راجع السياسة المؤكدة قبل الشراء، من غير ما ده يلغي أي حقوق قانونية ليك.",
        ],
        [
          "التوصيل بياخد قد إيه؟",
          "مدة تجهيز الطلب والتوصيل لسه مش مؤكدة. مفيش موعد نقدر نوعدك بيه حاليًا؛ أي تقدير لازم يتوضح قبل الشراء بعد ما يتم تأكيده.",
        ],
        [
          "أول مجموعة هترجع تاني؟",
          "مفيش قرار مؤكد عن إعادة طرح المجموعة. التصميمات لسه بتتجهّز، ومش هنقول «آخر فرصة» من غير سبب حقيقي.",
        ],
        [
          "ممكن أفضل مجهول في صفحة الداعمين؟",
          "الظهور العام اختياري: اسم تختاره، أو ظهور مجهول، أو عدم الظهور. حاليًا إعدادات الملف مجرد معاينة مؤقتة؛ مش بتسجل اختيارك ومش بتنشره، ومفيش ملفات عامة متاحة لسه.",
        ],
        [
          "أتواصل مع البراند إزاي؟",
          "إيميل الدعم وحساب إنستجرام الرسمي لسه مش متوفرين هنا. هنضيف بيانات التواصل الحقيقية بعد تأكيدها؛ مش هنخترع إيميل أو رقم تليفون.",
        ],
      ]
    : [
        [
          "Who is Snobi?",
          "Snobi is a doodle of a dog with big ambitions and empty pockets, and the face of an Egyptian clothing brand. This is Phase 0: still broke, still at the beginning.",
        ],
        [
          "What happens when I help Snobi?",
          "When products are available, buying clothing helps Snobi’s fictional story continue. You’re buying the stated product, not ownership in the brand or an investment return. It is not a tax-deductible charity donation.",
        ],
        [
          "Do I receive a T-shirt?",
          "Your order includes the clothing item you select from available products. The current images are design previews, not confirmed items available to order. Final product details, prices and sizes are still unconfirmed.",
        ],
        [
          "What exactly am I paying for?",
          "The selected product at its displayed price, plus a delivery fee we confirm with you by phone before shipping. Design previews are not for sale; a design preview is not something you can pay for.",
        ],
        [
          "How do I choose my size?",
          "Sizes and a measurement guide are not confirmed yet. Once a product is available, choose from the sizes on its product page and check its measurement guide if provided. A mockup photo is not a size guide.",
        ],
        [
          "How much is delivery?",
          "Delivery areas and fees are not confirmed yet. There is no fixed delivery fee or free-shipping promise at this stage. After you order, we’ll call or WhatsApp you with the delivery fee before shipping; if it doesn’t work for you, we don’t ship.",
        ],
        [
          "Which payment methods are available?",
          "Right now it’s cash on delivery only. You pay nothing on the website and we never ask for card details. If other payment methods are added, we’ll say so here.",
        ],
        [
          "Can I exchange or return my shirt?",
          "An exchange and return policy has not been published yet. We won’t invent a deadline or conditions. Review the confirmed policy before buying; this does not remove any statutory rights you may have.",
        ],
        [
          "How long does delivery take?",
          "Order preparation and delivery times are not confirmed yet. We cannot promise a delivery date right now. Any estimate needs to be confirmed and disclosed before purchase.",
        ],
        [
          "Will the first collection return?",
          "There is no confirmed restock decision. The designs are still taking shape, and we won’t call it your “last chance” without a real reason.",
        ],
        [
          "Can I remain anonymous on the supporters page?",
          "Public display is optional: a name you choose, anonymous display, or no public appearance. Profile settings are currently temporary previews only; they do not save consent or publish anything. Public profiles are not open yet.",
        ],
        [
          "How do I contact the brand?",
          "A support email and official Instagram account are not available here yet. We’ll add the actual contact details once confirmed, rather than invent an email address or phone number.",
        ],
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
          <span>{ar ? "١٢ سؤال · إجابات صريحة" : "12 QUESTIONS · HONEST ANSWERS"}</span>
          <p>
            {ar ? "لو حاجة لسه مش مؤكدة، هنقول." : "If something isn’t confirmed, we’ll say so."}
          </p>
        </div>
        <Accordion type="single" collapsible defaultValue="question-0" className="faq-accordion">
          {questions.map(([question, answer], i) => (
            <AccordionItem value={`question-${i}`} key={i}>
              <AccordionTrigger className="faq-question">
                <span className="faq-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{question}</span>
              </AccordionTrigger>
              <AccordionContent className="faq-answer">
                <p>{answer}</p>
                {i === 10 && (
                  <Button variant="note" asChild>
                    <Link to="/supporters">
                      {ar ? "صفحة الداعمين" : "VISIT THE SUPPORTERS PAGE"}
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
                {ar ? "شوف التصميمات" : "BACK TO THE DESIGNS"}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
