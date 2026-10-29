import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Collection, HowItWorks, StoryTeaser, Supporters, useLanguage } from "@/components/snobi";
import roadside from "@/assets/snobi-phase-0-roadside.png";
import { productsQuery } from "@/lib/catalog";
import { siteContentQuery } from "@/lib/site";
import { CURRENT_PHASE, phaseLabel } from "@/lib/phase";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snobi Is Broke. — Egyptian Streetwear" },
      {
        name: "description",
        content:
          "He needs your donation. You need his fashion sense. Meet Snobi, a broke doodle of a dog and an Egyptian streetwear brand.",
      },
      { property: "og:title", content: "Snobi Is Broke." },
      {
        property: "og:description",
        content: "He needs your donation. You need his fashion sense. Seems fair.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(siteContentQuery),
    ]);
  },
  component: Index,
});

function Index() {
  const { ar } = useLanguage();
  const { data: site } = useSuspenseQuery(siteContentQuery);
  const [wiggle, setWiggle] = useState(false);
  const seeShirts = () => {
    setWiggle(true);
    document.getElementById("collection")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <>
      <section className="home-hero page-width">
        <div className="hero-eyebrow">
          <span>{ar ? "مفيش فلوس. بس فيه أمل." : "NO MONEY. SOME HOPE."}</span>
        </div>
        <div className="hero-main">
          <div className="hero-copy">
            <h1>
              {ar ? (
                <>
                  سنوبي
                  <br />
                  <span className="broke-word">مفلس.</span>
                </>
              ) : (
                <>
                  SNOBI
                  <br />
                  IS <span className="broke-word">BROKE.</span>
                </>
              )}
            </h1>
            <p className="hero-subtitle">
              {ar ? (
                <>
                  هو محتاج تبرعك. وإنت محتاج ذوقه في اللبس.
                  <br />
                  شكلها صفقة عادلة.
                </>
              ) : (
                <>
                  he needs your donation. u need his fashion sense.
                  <br />
                  seems fair.
                </>
              )}
            </p>
            <div className="hero-buttons">
              <Button variant="ink" onClick={seeShirts}>
                {ar ? "ساعد سنوبي" : "HELP SNOBI"}
                <ArrowUpRight />
              </Button>
              <Button variant="note" asChild>
                <Link
                  to="/shop"
                  aria-label={
                    ar
                      ? `يعني إيه ${phaseLabel(CURRENT_PHASE, true)}؟ شوف هدوم المرحلة`
                      : `What is phase ${CURRENT_PHASE}? See this phase's clothes`
                  }
                >
                  {phaseLabel(CURRENT_PHASE, ar)}
                  {ar ? "؟" : "?"}
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </div>
          <figure
            className={`hero-art ${wiggle ? "mascot-wiggle" : ""}`}
            onAnimationEnd={() => setWiggle(false)}
          >
            <img
              className="hero-picture"
              src={site.heroImageUrl ?? roadside}
              alt={ar ? site.heroAltAr : site.heroAltEn}
              fetchPriority="high"
            />
            <span className="handwriting please-note">{ar ? "أرجوك." : "please."}</span>
            <Asterisk className="art-star" strokeWidth={1.6} aria-hidden="true" />
          </figure>
        </div>
        <div className="hero-bottom">
          <div className="support-counter">
            <div className="counter-value">
              — <span>{ar ? "تبرعات" : "Donations"}</span>
            </div>
            <div className="counter-message">
              <span className="handwriting">
                {ar ? "وضعه المالي محرج." : "his financial situation is embarrassing."}
              </span>
              <p>
                {ar ? "الدعم المؤكد لسه مش متاح." : "Verified support total not available yet."}
              </p>
            </div>
          </div>
          <span className="hero-scroll handwriting">
            {ar ? "انزل. هو بيحاول." : "scroll. he’s trying."}
            <ArrowDown />
          </span>
        </div>
      </section>
      <div className="ink-strip">
        <span>{ar ? "إنت تاخد تيشيرت." : "YOU GET A T-SHIRT."}</span>
        <Asterisk aria-hidden="true" />
        <span>{ar ? "هو يبطل يكون مفلس." : "HE GETS LESS BROKE."}</span>
        <Asterisk aria-hidden="true" />
        <span>{ar ? "الكل كسبان. تقريبًا." : "EVERYBODY WINS. SORT OF."}</span>
      </div>
      <Collection />
      <HowItWorks />
      <Supporters />
      <StoryTeaser />
    </>
  );
}
