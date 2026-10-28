import { createFileRoute, Link } from "@tanstack/react-router";
import { EmailLink, PolicyPage, type PolicySection } from "@/components/policy-page";
import { useLanguage } from "@/components/snobi";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Snobi" },
      {
        name: "description",
        content:
          "The terms for buying from Snobi: a fictional story, real clothes, prices in EGP, cash on delivery across Egypt, 14-day returns and Egyptian law.",
      },
      { property: "og:title", content: "Terms — Snobi" },
      {
        property: "og:description",
        content: "Plain-language terms for the Snobi clothing shop in Egypt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { ar } = useLanguage();
  const sections: PolicySection[] = ar
    ? [
        {
          title: "مين إحنا",
          body: (
            <p>
              الموقع ده بيديره سنوبي، براند ملابس في مصر. لما تطلب من الموقع بتكون بتشتري من سنوبي.
              للتواصل: <EmailLink />. باستخدامك للموقع أو طلبك منه إنت موافق على الشروط دي.
            </p>
          ),
        },
        {
          title: "سنوبي حكاية خيالية",
          body: (
            <p>
              سنوبي كلب كرتوني خيالي، و«ساعد سنوبي» جزء من الحكاية. لما تشتري، إنت بتشتري هدوم
              بالسعر المعروض. ده مش تبرع ولا عمل خيري ولا استثمار، ومش بيديك أي حصة أو ملكية أو عائد
              في سنوبي أو البراند أو الحكاية.
            </p>
          ),
        },
        {
          title: "المنتجات والكميات المحدودة",
          body: (
            <p>
              الكميات محدودة، وممكن المنتج يخلص حتى وهو في شنطتك. مش كل مجموعة بترجع تاني. الصور
              بتوضح المنتجات الحقيقية، بس الألوان ممكن تفرق شوية حسب الشاشة.
            </p>
          ),
        },
        {
          title: "الأسعار ومصاريف التوصيل",
          body: (
            <p>
              الأسعار بالجنيه المصري. مصاريف التوصيل بتختلف حسب المحافظة وبتظهر في صفحة إتمام الطلب
              قبل ما تأكد. الإجمالي هو تمن المنتجات زائد مصاريف التوصيل.
            </p>
          ),
        },
        {
          title: "الطلب والتأكيد",
          body: (
            <>
              <p>
                لما تبعت طلب، ده عرض منك للشراء. هنكلمك أو نبعتلك واتساب عشان نأكده، والبيع بيتم لما
                نأكد معاك.
              </p>
              <p>
                ممكن نلغي الطلب لو فيه غلط في المخزون أو السعر، أو لو معرفناش نوصلك بعد كذا محاولة،
                أو لو شكّينا إن الطلب وهمي أو فيه إساءة استخدام. ولأن الدفع عند الاستلام، مش هتدفع
                أي حاجة على طلب اتلغى.
              </p>
            </>
          ),
        },
        {
          title: "الدفع",
          body: (
            <p>
              الدفع كاش عند الاستلام بس، بالجنيه المصري لمندوب التوصيل. لو رفضت استلام طلبات أكتر من
              مرة من غير سبب مقبول، ممكن نوقف قبول طلبات الدفع عند الاستلام منك.
            </p>
          ),
        },
        {
          title: "التوصيل والاسترجاع",
          body: (
            <p>
              التفاصيل كلها في صفحة <Link to="/shipping">الشحن والاسترجاع</Link>. باختصار: تقدر
              ترجّع خلال ١٤ يوم من الاستلام، ومصاريف التوصيل مش بتترد.
            </p>
          ),
        },
        {
          title: "الملكية الفكرية",
          body: (
            <p>
              شخصية سنوبي والرسومات والتصميمات والشعار ومحتوى الموقع ملك سنوبي. ممنوع نسخها أو
              طباعتها أو بيعها أو استخدامها تجاريًا من غير إذن مكتوب مننا. شراء قطعة مش بيديك حقوق
              على التصميم. تصوير نفسك وإنت لابسها؟ ده مسموح، وبنحبه.
            </p>
          ),
        },
        {
          title: "الاستخدام المقبول",
          body: (
            <p>
              متعملش طلبات وهمية، ومتحاولش تعطّل الموقع أو تخترقه أو تضغط عليه، ومتستخدمش نموذج
              التواصل في رسايل مزعجة، ومتجمعش بيانات من الموقع بشكل آلي لأغراض مسيئة.
            </p>
          ),
        },
        {
          title: "حدود المسؤولية",
          body: (
            <p>
              بنحاول الموقع يكون شغال وصحيح، بس بنقدمه زي ما هو. في الحدود اللي يسمح بيها القانون
              المصري، مش مسؤولين عن خسائر غير مباشرة، ومسؤوليتنا عن أي طلب حدها المبلغ اللي دفعته
              فيه. ولا حاجة في الشروط دي بتقلل من حقوقك بموجب قانون حماية المستهلك رقم ١٨١ لسنة ٢٠١٨
              أو أي قانون آمر تاني.
            </p>
          ),
        },
        {
          title: "القانون المطبّق",
          body: <p>الشروط دي بيحكمها القانون المصري، والمحاكم المصرية هي المختصة بأي نزاع.</p>,
        },
        {
          title: "التعديلات والتواصل",
          body: (
            <p>
              ممكن نعدّل الشروط دي، وهنحدّث تاريخ آخر تحديث. الطلبات بتمشي على الشروط اللي كانت
              موجودة وقت الطلب. أسئلة؟ <EmailLink />. شوف كمان{" "}
              <Link to="/privacy">سياسة الخصوصية</Link>.
            </p>
          ),
        },
      ]
    : [
        {
          title: "Who we are",
          body: (
            <p>
              This website is run by Snobi, a clothing brand in Egypt. When you order here, you are
              buying from Snobi. Contact: <EmailLink />. By using the site or ordering, you agree to
              these terms.
            </p>
          ),
        },
        {
          title: "Snobi is a story",
          body: (
            <p>
              Snobi is a fictional cartoon dog, and “helping Snobi” is part of the story. When you
              buy, you are buying clothes at the displayed price. It is not a donation, charity or
              investment, and it gives you no stake, ownership or return in Snobi, the brand or the
              story.
            </p>
          ),
        },
        {
          title: "Products and limited drops",
          body: (
            <p>
              Stock is limited and items can sell out, even while they are in your bag. Not every
              drop comes back. Photos show the real items, but colours can look slightly different
              on different screens.
            </p>
          ),
        },
        {
          title: "Prices and delivery fees",
          body: (
            <p>
              Prices are in Egyptian pounds (EGP). The delivery fee depends on your governorate and
              is shown at checkout before you place your order. Your total is the items plus the
              delivery fee.
            </p>
          ),
        },
        {
          title: "Ordering and confirmation",
          body: (
            <>
              <p>
                Placing an order is an offer to buy. We call or WhatsApp you to confirm it, and the
                sale is agreed once we confirm with you.
              </p>
              <p>
                We may cancel an order if there is a stock or price error, if we can’t reach you
                after several tries, or if we suspect a fake or abusive order. Because you pay on
                delivery, you are never charged for a cancelled order.
              </p>
            </>
          ),
        },
        {
          title: "Payment",
          body: (
            <p>
              Payment is cash on delivery only, in EGP, to the courier. If you refuse delivery more
              than once without a good reason, we may stop accepting cash-on-delivery orders from
              you.
            </p>
          ),
        },
        {
          title: "Delivery and returns",
          body: (
            <p>
              Everything is on the <Link to="/shipping">shipping &amp; returns</Link> page. In
              short: you can return items within 14 days of delivery, and delivery fees are not
              refundable.
            </p>
          ),
        },
        {
          title: "Intellectual property",
          body: (
            <p>
              The Snobi character, drawings, designs, logo and site content belong to Snobi. Don’t
              copy, print, sell or use them commercially without our written permission. Buying a
              piece doesn’t give you rights to its design. Taking photos of yourself wearing it is
              fine. Encouraged, even.
            </p>
          ),
        },
        {
          title: "Acceptable use",
          body: (
            <p>
              Don’t place fake orders, try to break into, disrupt or overload the site, use the
              contact form for spam, or scrape the site for abusive purposes.
            </p>
          ),
        },
        {
          title: "Liability",
          body: (
            <p>
              We try to keep the site working and accurate, but provide it as it is. To the extent
              Egyptian law allows, we are not liable for indirect losses, and our liability for an
              order is limited to the amount you paid for it. Nothing in these terms limits your
              rights under the Consumer Protection Law No. 181 of 2018 or any other mandatory law.
            </p>
          ),
        },
        {
          title: "Governing law",
          body: (
            <p>
              These terms are governed by Egyptian law, and the Egyptian courts have jurisdiction
              over any dispute.
            </p>
          ),
        },
        {
          title: "Changes and contact",
          body: (
            <p>
              We may update these terms and will change the date at the top when we do. Orders
              follow the terms in place when they were placed. Questions? <EmailLink />. See also
              our <Link to="/privacy">privacy policy</Link>.
            </p>
          ),
        },
      ];
  return (
    <PolicyPage
      crumb={ar ? "الشروط والأحكام" : "TERMS"}
      kicker={ar ? "القواعد. من غير لف ودوران." : "THE RULES. NO FINE PRINT GAMES."}
      title={
        ar ? (
          <>
            الشروط
            <br />
            والأحكام.
          </>
        ) : (
          <>
            TERMS OF
            <br />
            SALE & USE.
          </>
        )
      }
      note={ar ? "سنوبي قراها. فهم نصها." : "snobi read them. understood about half."}
      updated={ar ? "آخر تحديث: ٢٩ أكتوبر ٢٠٢٦" : "LAST UPDATED: 29 OCTOBER 2026"}
      sections={sections}
    />
  );
}
