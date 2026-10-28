import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Asterisk } from "lucide-react";
import { Mascot, useLanguage } from "@/components/snobi";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "The Sad Story of Snobi" },
      {
        name: "description",
        content:
          "A broke dog, an ambitious idea, and absolutely no business plan. This is Phase 0.",
      },
      { property: "og:title", content: "The Sad Story of Snobi" },
      {
        property: "og:description",
        content: "The beginning of a very questionable financial journey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  const { ar } = useLanguage();
  const chapters = ar
    ? [
        [
          "كلب. مش خطة عمل.",
          "ده سنوبي. كلب مرسوم، بطموحات كبيرة وجيوب فاضية. مش مؤسس عبقري. مش خبير مالي. مجرد سنوبي.",
          "بداية مش مبشّرة.",
        ],
        [
          "عنده فكرة واحدة.",
          "سنوبي قرر إن طلب فلوس من الناس أسهل من إنه يظبط حياته. عشان كده أول مجموعة موجودة: وشه على تيشيرت، مقابل فرصة إنه يبطل يكون مفلس. لما المنتجات تبقى متاحة، إنت تختار تيشيرت وتدفع السعر الموضح؛ طلبك يشمل التيشيرت اللي اخترته.",
          "الوش موجود. الفلوس لأ.",
        ],
        [
          "لسه في البداية.",
          "دي المرحلة ٠. سنوبي لسه مفلس، وتصميمات الهدوم لسه بتتجهّز. مفيش قصة نجاح نعلنها. مجرد بداية تستاهل فرصة.",
          "مفيش نهاية سعيدة. لسه.",
        ],
      ]
    : [
        [
          "A DOG. NOT A BUSINESS PLAN.",
          "This is Snobi. A doodle of a dog with big ambitions and empty pockets. Not a visionary founder. Not a financial expert. Just Snobi.",
          "not a promising start.",
        ],
        [
          "HE HAS ONE IDEA.",
          "Snobi decided that asking people for money was easier than getting his life together. That’s why the first collection exists: his face on a T-shirt, in exchange for a chance to be less broke. When products are available, you choose a shirt and pay its displayed price; your purchase includes the selected shirt.",
          "he has the face. not the funds.",
        ],
        [
          "THIS IS THE BEGINNING.",
          "We’re in Phase 0. Snobi is still broke, and the clothing designs are still taking shape. No success story to announce. Just a beginning worth a chance.",
          "no happy ending. yet.",
        ],
      ];
  return (
    <>
      <section className="story-opening page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {ar ? "الحكاية" : "THE STORY"}
          </span>
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
        </div>
        <div className="story-opening-title">
          <span className="section-kicker">
            {ar ? "حكاية مالية مشكوك فيها" : "A QUESTIONABLE FINANCIAL HISTORY"}
          </span>
          <h1>
            {ar ? (
              <>
                حكاية سنوبي
                <br />
                الحزينة.
              </>
            ) : (
              <>
                THE SAD STORY
                <br />
                OF SNOBI.
              </>
            )}
          </h1>
          <p className="handwriting">
            {ar ? "طموحات كبيرة. رصيد مش كبير." : "big dreams. very small balance."}
          </p>
        </div>
        <figure className="story-portrait">
          <span className="handwriting portrait-note">
            {ar ? "بطل الحكاية. للأسف." : "our protagonist. unfortunately."}
          </span>
          <Mascot className="story-page-mascot" />
          <span className="handwriting portrait-caption">
            {ar ? "مش محتاج كتير. بس محتاج فلوس." : "a simple dog. an expensive existence."}
          </span>
        </figure>
        <div className="story-opening-bottom">
          <span>{ar ? "صُنع في مصر. مرسوم بأمل." : "MADE IN EGYPT. DRAWN WITH HOPE."}</span>
          <span className="handwriting">{ar ? "لسه مفلس." : "still broke."}</span>
        </div>
      </section>
      <section
        className="story-chapters page-width"
        aria-label={ar ? "حكاية سنوبي" : "Snobi’s story"}
      >
        {chapters.map(([title, text, note], i) => (
          <article className="story-chapter" key={title}>
            <span className="chapter-number">0{i + 1}</span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
            <span className="handwriting chapter-note">{note}</span>
          </article>
        ))}
      </section>
      <section className="story-history page-width" aria-labelledby="story-history-title">
        <span className="section-kicker">{ar ? "الحكاية لحد دلوقتي" : "THE RECORD. SO FAR."}</span>
        <h2 id="story-history-title">{ar ? "بداية صغيرة جدًا." : "A VERY SHORT HISTORY."}</h2>
        <ol className="story-timeline">
          <li>
            <span className="phase-label">{ar ? "المرحلة ٠ · دلوقتي" : "PHASE 0 · NOW"}</span>
            <h3>{ar ? "سنوبي مفلس." : "SNOBI IS BROKE."}</h3>
            <p>
              {ar
                ? "دي نقطة البداية. تصميمات أول مجموعة بتتجهّز، وسنوبي لسه معندوش قصة نجاح يحكيها."
                : "This is the starting point. The first collection’s designs are taking shape. Snobi still has no success story to tell."}
            </p>
            <span className="handwriting">
              {ar ? "الخطة الأصلية: " : "original plan: "}
              <s>{ar ? "يظبط حياته" : "get his life together"}</s>
            </span>
          </li>
        </ol>
        <p className="story-history-note">
          {ar
            ? "مفيش إنجازات مكتملة أو تحديثات مؤكدة بعد البداية لسه. أي أحداث جاية هتتضاف هنا بعد ما تحصل فعلًا."
            : "No completed milestones or verified updates beyond this starting point yet. New entries belong here only after they actually happen."}
        </p>
      </section>
      <section className="story-ledger-band">
        <div className="page-width story-ledger-layout">
          <div>
            <span className="section-kicker">{ar ? "من دفتر سنوبي" : "FROM SNOBI’S NOTEBOOK"}</span>
            <h2>{ar ? "الفلوس راحت فين؟" : "WHERE DID\nTHE MONEY GO?"}</h2>
            <p className="handwriting">
              {ar ? "متعتمدش عليه في نصيحة مالية." : "do not take financial advice from him."}
            </p>
          </div>
          <div className="story-ledger">
            <div className="ledger-heading">
              <span>{ar ? "أولويات سنوبي المالية" : "snobi’s financial priorities"}</span>
              <Asterisk aria-hidden="true" />
            </div>
            <dl>
              <div>
                <dt>{ar ? "الأكل" : "food"}</dt>
                <dd>{ar ? "أكتر من اللازم غالبًا" : "probably too much"}</dd>
              </div>
              <div>
                <dt>{ar ? "المدخرات" : "savings"}</dt>
                <dd>{ar ? "مدخرات إيه؟" : "what savings?"}</dd>
              </div>
              <div>
                <dt>{ar ? "التخطيط المالي" : "financial planning"}</dt>
                <dd className="note-red">{ar ? "لا" : "absolutely not"}</dd>
              </div>
            </dl>
            <p className="ledger-disclaimer">
              {ar
                ? "دي نكتة في حكاية كلب خيالي. مش حسابات فعلية أو بيان عن استخدام الفلوس."
                : "Fictional dog expenses. A story joke, not business accounting or a statement of how payments are used."}
            </p>
          </div>
        </div>
        <div className="page-width story-real-finances">
          <h3>{ar ? "أما الفلوس الحقيقية؟" : "AND THE REAL MONEY?"}</h3>
          <p>
            {ar
              ? "مفيش بيان مالي أو إجمالي دعم مؤكد منشور لسه. الدفتر اللي فوق مش دليل على مدفوعات أو مصروفات فعلية. أي معلومات مالية تتنشر لازم تكون مبنية على سجلات مؤكدة، مش حكاية سنوبي."
              : "No business financial report or verified support total is published yet. The notebook above is not evidence of real payments or spending. Any financial information published must come from verified records, not Snobi’s story."}
          </p>
        </div>
      </section>
      <section className="story-outro page-width">
        <span className="section-kicker">
          {ar ? "ده كل اللي عندنا. حاليًا." : "THAT’S THE STORY. SO FAR."}
        </span>
        <h2>{ar ? "خليك جزء من البداية." : "BE PART OF THE BEGINNING."}</h2>
        <p>
          {ar
            ? "شوف تصميمات الهدوم اللي ممكن تدي سنوبي فرصة."
            : "Meet the clothing designs that could give Snobi a chance."}
        </p>
        <Button variant="ink" asChild>
          <Link to="/shop">
            {ar ? "شوف التصميمات" : "SEE THE DESIGNS"}
            <ArrowUpRight />
          </Link>
        </Button>
        <p className="story-outro-fine">
          {ar
            ? "الأسعار والمقاسات والطلب لسه مش مؤكدة. مش تبرع خيري معفى من الضرائب."
            : "Prices, sizes and ordering are not confirmed yet. Not a tax-deductible charity donation."}
        </p>
      </section>
    </>
  );
}
