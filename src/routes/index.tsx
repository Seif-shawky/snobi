import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Asterisk } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collection,
  HowItWorks,
  Mascot,
  StoryTeaser,
  Supporters,
  useLanguage,
} from "@/components/snobi";
import { productsQuery } from "@/lib/catalog";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snobi Is Broke. — Egyptian Streetwear" },
      {
        name: "description",
        content:
          "He needs money. You get a T-shirt. Meet Snobi, a broke doodle of a dog and an Egyptian streetwear brand.",
      },
      { property: "og:title", content: "Snobi Is Broke." },
      { property: "og:description", content: "He needs money. You get a T-shirt. Seems fair." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQuery);
  },
  component: Index,
});

function Index() {
  const { ar } = useLanguage();
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
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
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
                  هو محتاج فلوس. إنت تاخد تيشيرت.
                  <br />
                  شكلها صفقة عادلة.
                </>
              ) : (
                <>
                  he needs money. you get a t-shirt.
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
              <Button variant="note" onClick={seeShirts}>
                {ar ? "شوف التيشيرتات" : "SEE THE T-SHIRTS"}
                <ArrowDown />
              </Button>
            </div>
            <p className="handwriting hero-cta-note">
              {ar ? "قرار مالي مشكوك فيه." : "this is probably a bad financial decision."}
            </p>
          </div>
          <div
            className={`hero-art ${wiggle ? "mascot-wiggle" : ""}`}
            onAnimationEnd={() => setWiggle(false)}
          >
            <span className="handwriting art-top-note">
              {ar ? "ده سنوبي." : "this is snobi."}
              <svg viewBox="0 0 100 70" aria-hidden="true">
                <path d="M12 5 Q78 7 62 57 M48 42 L62 59 L77 44" />
              </svg>
            </span>
            <Mascot className="hero-mascot" />
            <span className="handwriting please-note">{ar ? "أرجوك." : "please."}</span>
            <span className="handwriting art-bottom-note">
              {ar ? "معندوش أي حاجة." : "he has nothing."}
            </span>
            <Asterisk className="art-star" strokeWidth={1.6} aria-hidden="true" />
          </div>
        </div>
        <div className="hero-bottom">
          <div className="support-counter">
            <div>
              <span className="counter-label">
                {ar ? "إجمالي الدعم المؤكد" : "SNOBI HAS RECEIVED"}
              </span>
              <div className="counter-value">
                — <span>EGP</span>
              </div>
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
