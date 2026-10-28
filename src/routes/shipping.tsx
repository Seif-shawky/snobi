import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/snobi";
import { Button } from "@/components/ui/button";
import { loadDeliveryRates, useDeliveryRates } from "@/lib/delivery";
import { formatDeliveryEstimate } from "@/lib/delivery-rules";
import { formatMoney } from "@/lib/money";
import { GOVERNORATES } from "@/lib/order-schema";

const EMAIL = "seifwork006@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/snobi.isbroke";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping, Returns & Exchanges — Snobi" },
      {
        name: "description",
        content:
          "Snobi delivery fees by governorate, cash on delivery, cancellations, 14-day returns, refunds and size exchanges in Egypt.",
      },
      { property: "og:title", content: "Shipping, Returns & Exchanges — Snobi" },
      {
        property: "og:description",
        content:
          "Cash on delivery, delivery fees per governorate, and 14 days to change your mind. Snobi read the rules twice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => loadDeliveryRates(),
  component: ShippingPage,
});

const contactLinks = (ar: boolean) => (
  <>
    <a href={`mailto:${EMAIL}`} dir="ltr">
      {EMAIL}
    </a>{" "}
    {ar ? "أو إنستجرام" : "or Instagram"}{" "}
    <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" dir="ltr">
      @snobi.isbroke
    </a>
  </>
);

function ShippingPage() {
  const { ar } = useLanguage();
  const sections: { tag: string; title: string; body: ReactNode }[] = ar
    ? [
        {
          tag: "التوصيل",
          title: "كاش عند الاستلام",
          body: "بنوصّل للمحافظات اللي في الجدول فوق. مصاريف التوصيل لمحافظتك بتظهرلك في صفحة إتمام الطلب وبتتسجل مع الطلب. بتدفع الإجمالي (الهدوم + التوصيل) كاش لما الطلب يوصلك. ولا مليم قبلها.",
        },
        {
          tag: "التوصيل",
          title: "بنأكد قبل ما نشحن",
          body: "بعد ما تطلب، هنكلمك أو نبعتلك واتساب نأكد الطلب والعنوان قبل الشحن. مدة التوصيل المتوقعة هي اللي في الجدول بس، وبتتحسب من بعد التأكيد. لو مفيش مدة مكتوبة لمحافظتك، هنقولك لما نكلمك.",
        },
        {
          tag: "الإلغاء",
          title: "غيّرت رأيك قبل الشحن؟",
          body: (
            <>
              تقدر تلغي الطلب ببلاش قبل ما يتشحن. ابعتلنا على {contactLinks(ar)} برقم الطلب. بعد
              الشحن، بيبقى استرجاع (تحت).
            </>
          ),
        },
        {
          tag: "الاسترجاع",
          title: "١٤ يوم ترجّع فيهم",
          body: "تقدر ترجّع أي قطعة خلال ١٤ يوم من استلامها، زي ما قانون حماية المستهلك المصري رقم ١٨١ لسنة ٢٠١٨ بيقول. الشرط: القطعة متلبستش ومتغسلتش، والتيكت عليها، وفي تغليفها الأصلي. يعني جرّبها قدام المراية، مش في فرح.",
        },
        {
          tag: "الاسترجاع",
          title: "مين بيدفع إيه",
          body: "مصاريف التوصيل مش بترجع. مصاريف شحن المرتجع عليك، إلا لو القطعة فيها عيب أو إحنا بعتنالك قطعة أو مقاس غلط: ساعتها الشحن علينا.",
        },
        {
          tag: "الاسترداد",
          title: "فلوسك بترجع إزاي",
          body: "بعد ما القطعة توصلنا ونتأكد إنها مطابقة للشروط، بنرجّعلك سعرها بطريقة نتفق عليها (زي إنستاباي، أو محفظة موبايل، أو كاش)، وعادةً خلال ١٤ يوم من استلامنا ليها.",
        },
        {
          tag: "الاستبدال",
          title: "مقاس تاني؟",
          body: "الهدوم بتنزل كميات محدودة، فالاستبدال بمقاس تاني متاح بس طول ما المقاس ده لسه موجود. لو خلص، تقدر ترجّع القطعة وتسترد سعرها بنفس الشروط اللي فوق.",
        },
        {
          tag: "المساعدة",
          title: "إزاي تبدأ استرجاع أو استبدال",
          body: (
            <>
              ابعتلنا على {contactLinks(ar)} ومعاك رقم الطلب (زي SNB-XXXXXX). أو استخدم{" "}
              <Link to="/contact">صفحة التواصل</Link>. هنرد عليك ونتفق على الخطوات.
            </>
          ),
        },
      ]
    : [
        {
          tag: "DELIVERY",
          title: "Cash on delivery",
          body: "We deliver to the governorates in the table above. The fee for your governorate is shown at checkout and saved on your order. You pay the total (clothes + delivery) in cash when it arrives. Not a pound before.",
        },
        {
          tag: "DELIVERY",
          title: "We confirm before shipping",
          body: "After you order, we call or WhatsApp you to confirm the order and address before we ship. Delivery estimates are only the ones in the table, counted from when we confirm. If your governorate has no estimate listed, we’ll tell you when we call.",
        },
        {
          tag: "CANCELLING",
          title: "Changed your mind before it ships?",
          body: (
            <>
              You can cancel for free any time before your order ships. Message us at{" "}
              {contactLinks(ar)} with your order reference. Once it has shipped, it’s a return
              (below).
            </>
          ),
        },
        {
          tag: "RETURNS",
          title: "14 days to return",
          body: "You can return an item within 14 days of delivery, in line with Egypt’s Consumer Protection Law No. 181 of 2018. It must be unworn, unwashed, with its tags on and in its original packaging. Try it on in front of the mirror, not at a wedding.",
        },
        {
          tag: "RETURNS",
          title: "Who pays for what",
          body: "Delivery fees are not refundable. You pay the return shipping, unless the item is faulty or we sent you the wrong item or size: then we cover it.",
        },
        {
          tag: "REFUNDS",
          title: "How you get your money back",
          body: "Once the item reaches us and we’ve checked it meets the conditions above, we refund the item price by a method we agree with you (for example InstaPay, a mobile wallet or cash), typically within 14 days of receiving it.",
        },
        {
          tag: "EXCHANGES",
          title: "Different size?",
          body: "Our clothes come in limited drops, so you can exchange for another size only while that size is still in stock. If it’s gone, you can return the item for a refund under the same conditions.",
        },
        {
          tag: "HELP",
          title: "How to start a return or exchange",
          body: (
            <>
              Message us at {contactLinks(ar)} with your order reference (like SNB-XXXXXX), or use
              the <Link to="/contact">contact page</Link>. We’ll reply and agree the next steps with
              you.
            </>
          ),
        },
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
            {ar ? "سنوبي قرا القواعد. مرتين." : "snobi read the rules. twice."}
          </p>
        </div>
      </section>
      <section className="faq-answers page-width" aria-label={ar ? "السياسات" : "Policies"}>
        <div className="faq-topline">
          <span>{ar ? "التوصيل · الاسترجاع · الاستبدال" : "DELIVERY · RETURNS · EXCHANGES"}</span>
          <p>
            {ar
              ? "قواعد واضحة. هزار خفيف. مفيش كلام صغير في الآخر."
              : "Plain rules. Light jokes. No small print."}
          </p>
        </div>
        <DeliveryFees ar={ar} />
        <div className="policy-grid">
          {sections.map((section, i) => (
            <article className="policy-card" key={i}>
              <div className="policy-card-top">
                <span className="faq-number">{String(i + 1).padStart(2, "0")}</span>
                <span className="policy-status">{section.tag}</span>
              </div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
        <p className="shipping-legal-note">
          {ar
            ? "السياسة دي مش بتقلل من أي حقوق ليك بموجب القانون المصري."
            : "Nothing in this policy limits your rights under Egyptian law."}
        </p>
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

function DeliveryFees({ ar }: { ar: boolean }) {
  const { data: rates, isError, refetch } = useDeliveryRates(Route.useLoaderData());
  const byGov = new Map((rates ?? []).map((r) => [r.governorate, r] as const));
  const rows = GOVERNORATES.flatMap((g) => {
    const rate = byGov.get(g.value);
    return rate ? [{ name: ar ? g.ar : g.en, rate }] : [];
  });
  return (
    <section className="delivery-fees" aria-labelledby="delivery-fees-title">
      <h2 id="delivery-fees-title">{ar ? "مصاريف التوصيل" : "DELIVERY FEES"}</h2>
      {rates === undefined ? (
        isError ? (
          <div className="cart-error" role="alert">
            <p>
              {ar
                ? "مش قادرين نجيب مصاريف التوصيل دلوقتي."
                : "We couldn’t load the delivery fees right now."}
            </p>
            <Button variant="note" onClick={() => void refetch()}>
              {ar ? "حاول تاني" : "TRY AGAIN"}
            </Button>
          </div>
        ) : (
          <p className="cart-loading" role="status">
            <Loader2 className="animate-spin" aria-hidden="true" />
            {ar ? "بنجيب المصاريف…" : "Loading fees…"}
          </p>
        )
      ) : rows.length === 0 ? (
        <p className="delivery-fees-empty" role="status">
          {ar
            ? "التوصيل لسه متظبطش، فالطلبات واقفة مؤقتًا. المصاريف هتظهر هنا أول ما نحددها."
            : "Delivery isn’t set up yet, so orders are paused. Fees will appear here as soon as they’re set."}
        </p>
      ) : (
        <>
          <div className="delivery-table-wrap">
            <table className="delivery-table">
              <thead>
                <tr>
                  <th scope="col">{ar ? "المحافظة" : "Governorate"}</th>
                  <th scope="col">{ar ? "مصاريف التوصيل" : "Delivery fee"}</th>
                  <th scope="col">{ar ? "المدة المتوقعة" : "Estimate"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ name, rate }) => (
                  <tr key={rate.governorate}>
                    <th scope="row">{name}</th>
                    <td>
                      {rate.feeCents === 0
                        ? ar
                          ? "مجاني"
                          : "Free"
                        : formatMoney(rate.feeCents, ar)}
                    </td>
                    <td>{formatDeliveryEstimate(rate.minDays, rate.maxDays, ar) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="delivery-fees-note">
            {ar
              ? "المدة بتتحسب من بعد ما نأكد الطلب معاك. المحافظات اللي مش في الجدول لسه مش بنوصّلها."
              : "Estimates count from when we confirm your order. We don’t deliver to governorates missing from this table yet."}
          </p>
        </>
      )}
    </section>
  );
}
