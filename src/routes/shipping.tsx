import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/snobi";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping, Returns & Exchanges — Snobi" },
      {
        name: "description",
        content:
          "Snobi delivery, returns, exchanges and cancellation information for Egypt. Unconfirmed policies are clearly marked.",
      },
      { property: "og:title", content: "Shipping, Returns & Exchanges — Snobi" },
      {
        property: "og:description",
        content:
          "How delivery, exchanges and returns will work. Nothing invented. Some things still pending.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const { ar } = useLanguage();
  const sections = ar
    ? [
        [
          "مناطق ورسوم التوصيل",
          "المحافظات اللي بنوصل لها والرسوم لكل منطقة لسه مش مؤكدة. بعد ما تطلب، هنكلمك أو نبعتلك واتساب نأكد مصاريف التوصيل قبل الشحن.",
        ],
        ["مدة التوصيل المتوقعة", "مدة التوصيل لسه مش مؤكدة. مش هنوعدك بميعاد قبل ما نتأكد."],
        ["تجهيز الطلب", "وقت تجهيز الطلب قبل الشحن لسه مش مؤكد."],
        ["استبدال المقاس", "شروط ومدة استبدال المقاس لسه مش منشورة."],
        [
          "الاسترجاع واسترداد الفلوس",
          "شروط الاسترجاع وأهلية استرداد الفلوس لسه مش منشورة. ده مش بيلغي أي حقوق قانونية ليك.",
        ],
        ["قطع تالفة أو غلط", "خطوات الإبلاغ عن قطعة تالفة أو غلط والمدة المتاحة لسه مش مؤكدة."],
        ["إلغاء الطلب", "قواعد ومواعيد إلغاء الطلب لسه مش مؤكدة."],
        [
          "طلب مساعدة",
          "بيانات التواصل الرسمية لسه مش متوفرة. صفحة التواصل فيها نموذج معاينة لحد ما الإرسال يتفعّل.",
        ],
      ]
    : [
        [
          "Shipping areas and fees",
          "Which governorates we deliver to, and the fee for each, are not confirmed yet. After you order, we’ll call or WhatsApp you to confirm the delivery fee before shipping.",
        ],
        [
          "Estimated delivery windows",
          "Delivery times are not confirmed yet. We won’t promise a date until we can keep it.",
        ],
        [
          "Order processing",
          "How long an order takes to prepare before shipping is not confirmed yet.",
        ],
        ["Size exchanges", "Size exchange conditions and deadlines have not been published yet."],
        [
          "Returns and refund eligibility",
          "Return conditions and refund eligibility have not been published yet. This does not remove any statutory rights you may have.",
        ],
        [
          "Damaged or incorrect items",
          "How to report a damaged or incorrect item, and the time allowed, are not confirmed yet.",
        ],
        ["Cancellation rules", "Order cancellation rules and deadlines are not confirmed yet."],
        [
          "How to request assistance",
          "Official contact details are not available yet. The contact page has a preview form until sending is connected.",
        ],
      ];
  return (
    <>
      <section className="faq-intro page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> /{" "}
            {ar ? "الشحن والاسترجاع" : "SHIPPING & RETURNS"}
          </span>
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
        </div>
        <div className="faq-title">
          <span className="section-kicker">{ar ? "للعملاء في مصر" : "FOR CUSTOMERS IN EGYPT"}</span>
          <h1>
            {ar ? (
              <>
                الشحن، الاسترجاع
                <br />
                والاستبدال.
              </>
            ) : (
              <>
                SHIPPING, RETURNS
                <br />& EXCHANGES.
              </>
            )}
          </h1>
          <p className="handwriting">
            {ar ? "سنوبي لسه بيكتب القواعد." : "snobi is still writing the rules."}
          </p>
        </div>
      </section>
      <section className="faq-answers page-width" aria-label={ar ? "السياسات" : "Policies"}>
        <div className="faq-topline">
          <span>{ar ? "٨ أقسام · لسه بتتأكد" : "8 SECTIONS · PENDING CONFIRMATION"}</span>
          <p>
            {ar
              ? "مش هنخترع سياسات. اللي مش مؤكد مكتوب عليه كده."
              : "No invented policies. Anything unconfirmed is marked."}
          </p>
        </div>
        <div className="policy-grid">
          {sections.map(([title, text], i) => (
            <article className="policy-card" key={i}>
              <div className="policy-card-top">
                <span className="faq-number">{String(i + 1).padStart(2, "0")}</span>
                <span className="policy-status">{ar ? "لسه مش مؤكد" : "TO BE CONFIRMED"}</span>
              </div>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="policy-actions">
          <Button variant="note" asChild>
            <Link to="/faq">
              {ar ? "الأسئلة الشائعة" : "READ THE FAQ"}
              <ArrowUpRight />
            </Link>
          </Button>
          <Button variant="ink" asChild>
            <Link to="/contact">
              {ar ? "تواصل معانا" : "CONTACT SNOBI"}
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
