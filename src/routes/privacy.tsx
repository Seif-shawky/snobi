import { createFileRoute, Link } from "@tanstack/react-router";
import { EmailLink, PolicyPage, type PolicySection } from "@/components/policy-page";
import { useLanguage } from "@/components/snobi";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Snobi" },
      {
        name: "description",
        content:
          "What Snobi collects when you order or send a message, why, who it is shared with, how long it is kept and your rights under Egypt’s data protection law.",
      },
      { property: "og:title", content: "Privacy Policy — Snobi" },
      {
        property: "og:description",
        content: "Plain-language privacy policy for the Snobi clothing shop in Egypt. No trackers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { ar } = useLanguage();
  const sections: PolicySection[] = ar
    ? [
        {
          title: "مين إحنا",
          body: (
            <p>
              سنوبي براند ملابس صغير في مصر. سنوبي هو المسؤول عن البيانات الشخصية اللي بنجمعها من
              خلال الموقع ده. لأي سؤال عن بياناتك ابعتلنا على <EmailLink />.
            </p>
          ),
        },
        {
          title: "البيانات اللي بنجمعها",
          body: (
            <ul>
              <li>
                <strong>لما تطلب:</strong> اسمك، رقم موبايلك، المحافظة والمدينة والعنوان، الإيميل لو
                كتبته، ملاحظات التوصيل، والمنتجات والمقاسات والأسعار ورقم الطلب ووقته.
              </li>
              <li>
                <strong>لما تبعت رسالة:</strong> اسمك، إيميلك، رقم الطلب لو كتبته، رسالتك، وعنوان
                الـ IP بتاعك (بنستخدمه بس عشان نحد من الرسايل المزعجة).
              </li>
              <li>
                <strong>الشنطة:</strong> محفوظة في المتصفح بتاعك على جهازك (localStorage)، ومش
                بتوصلنا غير لما تأكد الطلب. اختيار اللغة مش بيتحفظ.
              </li>
              <li>
                <strong>كوكي الإدارة:</strong> كوكي دخول بيستخدمها صاحب المحل بس لصفحات الإدارة.
                الزوار مش بياخدوها.
              </li>
              <li>
                مش بنستخدم أدوات تحليلات أو إعلانات أو كوكيز تتبّع، ومش بنجمع بيانات كروت دفع، لأن
                الدفع كاش عند الاستلام.
              </li>
            </ul>
          ),
        },
        {
          title: "بنستخدمها في إيه",
          body: (
            <ul>
              <li>نجهّز طلبك ونوصّله.</li>
              <li>نكلمك أو نبعتلك واتساب عشان نأكد الطلب والتوصيل.</li>
              <li>نرد على رسايلك ونتعامل مع الاسترجاع والاستبدال.</li>
              <li>نمنع الطلبات الوهمية والرسايل المزعجة وإساءة استخدام الموقع.</li>
              <li>نلتزم بالواجبات القانونية والمحاسبية.</li>
            </ul>
          ),
        },
        {
          title: "مين بيشوفها معانا",
          body: (
            <ul>
              <li>
                <strong>شركات الشحن والتوصيل:</strong> بياخدوا مننا اللي محتاجينه عشان يوصّلوا الطلب
                بس: الاسم والموبايل والعنوان والمبلغ المطلوب تحصيله.
              </li>
              <li>
                <strong>Cloudflare:</strong> بتستضيف الموقع وقاعدة البيانات، وممكن تعالج البيانات
                على سيرفرات برا مصر.
              </li>
              <li>
                <strong>Google Fonts:</strong> الخطوط بتتحمّل من سيرفرات جوجل، فجوجل بتشوف عنوان الـ
                IP ونوع المتصفح لما تفتح الصفحات.
              </li>
              <li>الجهات الرسمية لو القانون ألزمنا بكده.</li>
              <li>مش بنبيع بياناتك لحد. أبدًا.</li>
            </ul>
          ),
        },
        {
          title: "بنحتفظ بيها قد إيه",
          body: (
            <ul>
              <li>الطلبات: طول ما هي لازمة للتوصيل والاسترجاع والالتزامات القانونية والمحاسبية.</li>
              <li>
                الرسايل: بنمسحها لما مانحتاجهاش، وبحد أقصى ١٢ شهر. عنوان الـ IP بيتمسح مع الرسالة.
              </li>
              <li>الشنطة: لحد ما تفضّيها أو تمسح بيانات المتصفح.</li>
            </ul>
          ),
        },
        {
          title: "حقوقك",
          body: (
            <p>
              بموجب قانون حماية البيانات الشخصية المصري رقم ١٥١ لسنة ٢٠٢٠، من حقك تطلب تشوف بياناتك،
              أو تصححها، أو تمسحها، أو تعترض على طريقة استخدامها. ابعتلنا على <EmailLink />. ممكن
              نطلب منك رقم الطلب والموبايل عشان نتأكد إنك صاحب البيانات. بعض سجلات الطلبات ممكن نكون
              ملزمين نحتفظ بيها قانونيًا.
            </p>
          ),
        },
        {
          title: "الأمان",
          body: (
            <p>
              الموقع شغال على اتصال مشفّر (HTTPS)، وصفحات الإدارة محمية بكلمة سر. مفيش نظام كامل،
              فلو حسيت إن فيه مشكلة في بياناتك، قولنا على طول.
            </p>
          ),
        },
        {
          title: "الأطفال",
          body: <p>الموقع مش موجّه للأطفال. لو سنك أقل من ١٨ سنة، اطلب بموافقة ولي أمرك.</p>,
        },
        {
          title: "التعديلات",
          body: (
            <p>
              لو غيّرنا السياسة دي هنحدّث الصفحة دي وتاريخ آخر تحديث. شوف كمان{" "}
              <Link to="/terms">الشروط والأحكام</Link>.
            </p>
          ),
        },
      ]
    : [
        {
          title: "Who we are",
          body: (
            <p>
              Snobi is a small clothing brand in Egypt. Snobi is responsible (the “controller”) for
              the personal data collected through this website. For anything about your data, email{" "}
              <EmailLink />.
            </p>
          ),
        },
        {
          title: "What we collect",
          body: (
            <ul>
              <li>
                <strong>When you order:</strong> your name, mobile number, governorate, city and
                address, email if you give one, delivery notes, and the items, sizes, prices, order
                reference and time of the order.
              </li>
              <li>
                <strong>When you send a message:</strong> your name, email, order number if you add
                one, your message, and your IP address (used only to limit spam).
              </li>
              <li>
                <strong>Your bag:</strong> kept in your own browser on your device (localStorage).
                We don’t receive it until you place an order. Your language choice is not stored.
              </li>
              <li>
                <strong>Admin cookie:</strong> a sign-in cookie used only by the shop owner for the
                admin pages. Visitors don’t get one.
              </li>
              <li>
                We use no analytics, advertising or tracking cookies, and we never collect payment
                card details: you pay cash on delivery.
              </li>
            </ul>
          ),
        },
        {
          title: "Why we use it",
          body: (
            <ul>
              <li>To prepare and deliver your order.</li>
              <li>To call or WhatsApp you to confirm your order and delivery.</li>
              <li>To answer your messages and handle returns and exchanges.</li>
              <li>To prevent fake orders, spam and abuse of the site.</li>
              <li>To meet legal and accounting obligations.</li>
            </ul>
          ),
        },
        {
          title: "Who we share it with",
          body: (
            <ul>
              <li>
                <strong>Delivery and courier partners</strong> get only what they need to deliver:
                name, mobile number, address and the amount to collect.
              </li>
              <li>
                <strong>Cloudflare</strong> hosts the website and database and may process data on
                servers outside Egypt.
              </li>
              <li>
                <strong>Google Fonts:</strong> our fonts load from Google’s servers, so Google sees
                your IP address and browser details when pages load.
              </li>
              <li>Authorities, if the law requires it.</li>
              <li>We never sell your data.</li>
            </ul>
          ),
        },
        {
          title: "How long we keep it",
          body: (
            <ul>
              <li>
                Orders: as long as needed for delivery, returns, and legal and accounting
                obligations.
              </li>
              <li>
                Messages: deleted once we no longer need them, and kept for at most 12 months. The
                IP address is deleted with the message.
              </li>
              <li>Your bag: until you empty it or clear your browser data.</li>
            </ul>
          ),
        },
        {
          title: "Your rights",
          body: (
            <p>
              Under Egypt’s Personal Data Protection Law No. 151 of 2020 you can ask to access,
              correct or delete your personal data, or object to how we use it. Email <EmailLink />.
              We may ask for your order reference and mobile number to confirm it’s you. Some order
              records may have to be kept for legal reasons.
            </p>
          ),
        },
        {
          title: "Security",
          body: (
            <p>
              The site runs over an encrypted connection (HTTPS) and the admin pages are password
              protected. No system is perfect, so if you think something is wrong with your data,
              tell us straight away.
            </p>
          ),
        },
        {
          title: "Children",
          body: (
            <p>
              The site is not aimed at children. If you are under 18, please order with your parent
              or guardian’s permission.
            </p>
          ),
        },
        {
          title: "Changes",
          body: (
            <p>
              If we change this policy, we’ll update this page and the date at the top. See also our{" "}
              <Link to="/terms">terms</Link>.
            </p>
          ),
        },
      ];
  return (
    <PolicyPage
      crumb={ar ? "سياسة الخصوصية" : "PRIVACY"}
      kicker={ar ? "بياناتك. بالبلدي." : "YOUR DATA. IN PLAIN WORDS."}
      title={
        ar ? (
          <>
            سياسة
            <br />
            الخصوصية.
          </>
        ) : (
          <>
            PRIVACY
            <br />
            POLICY.
          </>
        )
      }
      note={
        ar
          ? "سنوبي مش بيراقبك. مش قادر على تمنها."
          : "snobi isn’t tracking you. he can’t afford it."
      }
      updated={ar ? "آخر تحديث: ٢٩ أكتوبر ٢٠٢٦" : "LAST UPDATED: 29 OCTOBER 2026"}
      sections={sections}
    />
  );
}
