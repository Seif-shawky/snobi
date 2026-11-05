import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Heart, ShieldCheck, EyeOff } from "lucide-react";
import { Mascot, SupporterList, useLanguage } from "@/components/snobi";
import { Button } from "@/components/ui/button";
import { supportersQuery } from "@/lib/community";
import { SNOBI_EMAIL } from "@/lib/contact-details";
export const Route = createFileRoute("/supporters")({
  head: () => ({
    meta: [
      { title: "Snobi’s Enablers" },
      {
        name: "description",
        content:
          "The people helping a broke dog. Only delivered orders whose buyers chose to be listed.",
      },
      { property: "og:title", content: "Snobi’s Enablers" },
      { property: "og:description", content: "Good people. Questionable decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(supportersQuery),
  component: SupportersPage,
});

function SupportersPage() {
  const { ar } = useLanguage();
  const { data: supporters } = useSuspenseQuery(supportersQuery);
  return (
    <>
      <section className="enablers-intro page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {ar ? "الداعمين" : "SUPPORTERS"}
          </span>
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
        </div>
        <div className="enablers-title">
          <span className="section-kicker">
            {ar ? "ناس كويسة. قرارات مشكوك فيها." : "GOOD PEOPLE. QUESTIONABLE DECISIONS."}
          </span>
          <h1>
            {ar ? (
              <>
                المتواطئين
                <br />
                مع سنوبي.
              </>
            ) : (
              <>
                SNOBI’S
                <br />
                ENABLERS.
              </>
            )}
          </h1>
          <p className="handwriting">
            {ar ? "هو مش مفلس لوحده. هو بس لسه لوحده." : "a support group. for his lack of money."}
          </p>
        </div>
        <div className="enablers-intro-bottom">
          <p>
            {ar
              ? "الناس اللي بتدي حكاية كلب مفلس فرصة تكمل. مجتمع صغير، مش مسابقة مالية."
              : "The people giving a broke dog’s story a chance. A little community, not a financial competition."}
          </p>
          <span>
            <ShieldCheck aria-hidden="true" />
            {ar ? "دعم مؤكد فقط · الظهور باختيارك" : "VERIFIED ONLY · PUBLIC BY CHOICE"}
          </span>
        </div>
      </section>
      <section className="enablers-activity page-width" aria-labelledby="recent-support-title">
        <div className="enablers-section-heading">
          <div>
            <Heart aria-hidden="true" />
            <h2 id="recent-support-title">{ar ? "المتواطئين." : "THE ENABLERS."}</h2>
          </div>
          <span className="handwriting">
            {ar ? "سنوبي بيستنى." : "he is refreshing this page."}
          </span>
        </div>
        {supporters.length === 0 ? (
          <div className="enablers-waiting">
            <Mascot className="waiting-mascot" />
            <p className="handwriting">{ar ? "محدش ظهر هنا لسه." : "nobody on the list yet."}</p>
            <p>
              {ar
                ? "الأسماء بتظهر هنا بعد ما الطلبات توصل. مش هنخترع أصحاب لسنوبي."
                : "Names appear here once orders are delivered. We’re not making up friends for him."}
            </p>
            <Button variant="note" asChild>
              <Link to="/shop">
                {ar ? "شوف الهدوم" : "SEE THE CLOTHES"}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        ) : (
          <SupporterList supporters={supporters} />
        )}
      </section>
      <section className="enablers-ranking-band">
        <div className="page-width enablers-ranking">
          <div>
            <span className="section-kicker">
              {ar ? "التقدير. مش الاستثمار." : "RECOGNITION. NOT AN INVESTMENT."}
            </span>
            <h2>
              <Heart aria-hidden="true" />
              {ar ? "مفيش ترتيب." : "NO LEADERBOARD."}
            </h2>
            <p>
              {ar
                ? "مجرد قائمة أسماء. مفيش مراكز ومفيش مبالغ، لأن مين دفع كام مش شغل حد."
                : "Just a list of names. No places and no amounts, because who paid what is nobody’s business."}
            </p>
          </div>
          <div className="enablers-rules">
            <h3>{ar ? "القواعد." : "THE RULES."}</h3>
            <ul>
              <li>
                {ar
                  ? "الطلبات اللي اتسلّمت بس هي اللي بتظهر هنا."
                  : "Only delivered orders appear here."}
              </li>
              <li>
                {ar
                  ? "الظهور باختيارك وقت الطلب. لو طلبت أكتر من مرة، آخر اختيار ليك هو اللي بيتحسب."
                  : "Being listed is your choice at checkout. If you order more than once, your latest choice counts."}
              </li>
              <li>
                {ar
                  ? "مفيش ملكية أو عوائد استثمار أو مكافآت مالية. مجرد تقدير."
                  : "No ownership, investment returns or financial rewards. Just a little recognition."}
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section className="enablers-privacy page-width">
        <div>
          <span className="section-kicker">{ar ? "اسمك. اختيارك." : "YOUR NAME. YOUR CALL."}</span>
          <h2>{ar ? "ساعده من غير أضواء." : "ENABLE HIM. NOT THE SPOTLIGHT."}</h2>
          <p>
            {ar
              ? "في صفحة إتمام الطلب تقدر تختار: اسم تحدده، أو ظهور مجهول، أو عدم الظهور خالص. عدم الظهور هو الاختيار الأساسي."
              : "At checkout you choose: a name you pick, anonymous, or not at all. Not at all is the default."}
          </p>
          <p>
            {ar ? "عايز تتشال من القائمة؟ ابعت رقم طلبك على " : "Want to come off the list? Email "}
            <a href={`mailto:${SNOBI_EMAIL}`}>{SNOBI_EMAIL}</a>
            {ar ? "." : " with your order number."}
          </p>
          <Button variant="note" asChild>
            <Link to="/shop">
              {ar ? "شوف الهدوم" : "SEE THE CLOTHES"}
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
        <div className="enablers-title-note">
          <EyeOff aria-hidden="true" />
          <p className="handwriting">
            {ar ? "موبايلك وعنوانك مش هنا." : "your phone and address stay off this page."}
          </p>
          <span>
            {ar ? "ولا اسمك الحقيقي، إلا لو كتبته." : "So does your real name, unless you type it."}
          </span>
        </div>
      </section>
    </>
  );
}
