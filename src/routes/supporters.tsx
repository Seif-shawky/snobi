import { useEffect, useState } from "react";
import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Heart, ShieldCheck } from "lucide-react";
import { Leaderboard, Mascot, useLanguage } from "@/components/snobi";
import { SnobiAvatar } from "@/components/snobi-avatar";
import { Button } from "@/components/ui/button";
import { currentUserQuery } from "@/lib/account";
import { donationFeedQuery, helpersQuery, leaderboardQuery } from "@/lib/community";
import { relativeTime } from "@/lib/community-rules";
import { formatMoney } from "@/lib/money";
import { CURRENT_PHASE, phaseLabel } from "@/lib/phase";

export const Route = createFileRoute("/supporters")({
  head: () => ({
    meta: [
      { title: "Snobi’s Enablers" },
      {
        name: "description",
        content:
          "The top 5 people helping a broke dog, a live feed of donations and everyone who chose to be public.",
      },
      { property: "og:title", content: "Snobi’s Enablers" },
      { property: "og:description", content: "Good people. Questionable decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(leaderboardQuery),
      context.queryClient.ensureQueryData(donationFeedQuery),
      context.queryClient.ensureQueryData(helpersQuery),
    ]);
  },
  component: SupportersPage,
});

function SupportersPage() {
  const { ar } = useLanguage();
  const { data: leaders } = useSuspenseQuery(leaderboardQuery);
  const { data: helpers } = useSuspenseQuery(helpersQuery);
  const { data: user } = useQuery(currentUserQuery);
  return (
    <>
      <section className="enablers-intro page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {ar ? "الداعمين" : "SUPPORTERS"}
          </span>
          <span className="phase-label">{phaseLabel(CURRENT_PHASE, ar)}</span>
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
          <div>
            <p>
              {ar
                ? "الناس اللي بتدي حكاية كلب مفلس فرصة تكمل، واختاروا يتشافوا وهم بيعملوا كده."
                : "The people giving a broke dog’s story a chance, who chose to be seen doing it."}
            </p>
            {user === null && (
              <Button variant="ink" asChild>
                <Link to="/join">
                  {ar ? "اعمل سنوبي بتاعك" : "CREATE YOUR OWN SNOBI"}
                  <ArrowUpRight />
                </Link>
              </Button>
            )}
          </div>
          <span>
            <ShieldCheck aria-hidden="true" />
            {ar ? "طلبات مؤكدة بس · الظهور باختيارك" : "CONFIRMED ORDERS ONLY · PUBLIC BY CHOICE"}
          </span>
        </div>
      </section>
      <section className="enablers-activity page-width" aria-labelledby="leaderboard-title">
        <div className="enablers-section-heading">
          <div>
            <Heart aria-hidden="true" />
            <h2 id="leaderboard-title">{ar ? "أعلى ٥." : "THE TOP 5."}</h2>
          </div>
          <span className="handwriting">
            {ar ? "سنوبي بيستنى." : "he is refreshing this page."}
          </span>
        </div>
        {leaders.length === 0 ? (
          <div className="enablers-waiting">
            <Mascot className="waiting-mascot" />
            <p className="handwriting">{ar ? "محدش هنا لسه." : "nobody up here yet."}</p>
            <p>
              {ar
                ? "الأسماء بتظهر هنا بعد ما نأكد الطلبات. مش هنخترع أصحاب لسنوبي."
                : "Names appear here once orders are confirmed. We’re not making up friends for him."}
            </p>
            <Button variant="note" asChild>
              <Link to="/shop">
                {ar ? "شوف الهدوم" : "SEE THE CLOTHES"}
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        ) : (
          <Leaderboard entries={leaders} />
        )}
      </section>
      <LiveFeed />
      {helpers.length > 0 && (
        <section className="enablers-activity page-width" aria-labelledby="helpers-title">
          <div className="enablers-section-heading">
            <div>
              <h2 id="helpers-title">{ar ? "كل المتواطئين." : "EVERY ENABLER."}</h2>
            </div>
            <span className="handwriting">{ar ? "من غير مبالغ." : "no amounts down here."}</span>
          </div>
          <ul className="helpers-grid">
            {helpers.map((helper, index) => (
              <li key={`${index}-${helper.displayName}`}>
                <SnobiAvatar
                  imageUrl={helper.imageUrl}
                  wornUrls={helper.wornUrls}
                  alt=""
                  className="helper-avatar"
                />
                <span>{helper.displayName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="enablers-ranking-band">
        <div className="page-width enablers-rules">
          <h3>{ar ? "القواعد." : "THE RULES."}</h3>
          <ul>
            <li>
              {ar
                ? "المبالغ هي أسعار الهدوم في الطلبات المؤكدة، من غير مصاريف التوصيل."
                : "Amounts are clothing prices in confirmed orders, without delivery fees."}
            </li>
            <li>
              {ar
                ? "اللي بيظهر هنا بس اللي عنده حساب واختار يبقى ظاهر. موبايلك وعنوانك عمرهم ما بيظهروا."
                : "Only people with an account who chose to be public appear here. Your mobile and address never do."}
            </li>
            <li>
              {ar
                ? "تقدر تخفي نفسك في أي وقت من حسابك."
                : "You can hide yourself any time from your account."}
            </li>
            <li>
              {ar
                ? "مفيش ملكية أو استثمار أو مكافآت. مجرد تقدير."
                : "No ownership, investment or rewards. Just a little recognition."}
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

// The clock differs between server and browser, so times appear only after hydration.
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function LiveFeed() {
  const { ar } = useLanguage();
  const { data: feed } = useSuspenseQuery(donationFeedQuery);
  const hydrated = useHydrated();
  const now = useNow(30_000);
  return (
    <section className="enablers-activity page-width" aria-labelledby="feed-title">
      <div className="enablers-section-heading">
        <div>
          <span className="live-dot" aria-hidden="true" />
          <h2 id="feed-title">{ar ? "لايف." : "LIVE."}</h2>
        </div>
        <span className="handwriting">{ar ? "آخر التبرعات." : "latest donations first."}</span>
      </div>
      {feed.length === 0 ? (
        <p className="feed-empty">
          {ar ? "هادي. هادي أوي. سنوبي قلقان." : "Quiet. Very quiet. Snobi is concerned."}
        </p>
      ) : (
        <ol className="donation-feed">
          {feed.map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              <SnobiAvatar
                imageUrl={entry.imageUrl}
                wornUrls={entry.wornUrls}
                alt=""
                className="helper-avatar"
              />
              <p>
                <strong>{entry.displayName}</strong> {ar ? "اتبرع بـ" : "donated "}
                <strong className="feed-amount">{formatMoney(entry.amountCents, ar)}</strong>
              </p>
              <time>{hydrated ? relativeTime(entry.at, Math.max(now, Date.now()), ar) : ""}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
