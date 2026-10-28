import { Asterisk } from "lucide-react";
import { useLanguage } from "@/components/snobi";

export function ShopIntro() {
  const { ar } = useLanguage();
  return (
    <>
      <section className="shop-intro page-width">
        <div className="shop-breadcrumb">
          {ar ? "سنوبي / التيشيرتات والهدوم" : "SNOBI / THE CLOTHES"}
        </div>
        <div className="shop-intro-heading">
          <div>
            <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
            <h1>
              {ar ? (
                <>
                  سنوبي محتاج
                  <br />
                  <span className="broke-word">فلوس.</span>
                </>
              ) : (
                <>
                  SNOBI NEEDS
                  <br />
                  <span className="broke-word">MONEY.</span>
                </>
              )}
            </h1>
          </div>
          <div className="shop-intro-note">
            <p className="handwriting">
              {ar
                ? "هو معندوش كتير يقدمه.\nبس عنده هدوم."
                : "he doesn’t have much to offer.\nbut he does have clothes."}
            </p>
            <svg viewBox="0 0 130 65" aria-hidden="true">
              <path d="M10 10 Q110 0 95 55 M80 40 L95 57 L112 42" />
            </svg>
          </div>
        </div>
        <div className="shop-intro-bottom">
          <p>
            {ar
              ? "إنت تدعمه. إنت تاخد هدوم. هو يقرب خطوة من إنه يبطل يكون مفلس."
              : "You help him. You get clothes. He gets a little closer to not being broke."}
          </p>
          <span className="handwriting">
            {ar ? "صفقة غريبة. هدوم حلوة." : "strange arrangement. good clothes."}
          </span>
        </div>
      </section>
      <section className="shop-arrangement">
        <div className="page-width">
          <Asterisk aria-hidden="true" />
          <div>
            <h2>{ar ? "هدوم ليك. أمل لسنوبي." : "CLOTHES FOR YOU. HOPE FOR SNOBI."}</h2>
            <p>
              {ar
                ? "الدفع مقابل قطعة الهدوم الموضحة ودعم حكاية سنوبي الخيالية. مش تبرع لجمعية خيرية."
                : "Your payment covers the stated clothing item and supports Snobi’s fictional story. This is not a charitable donation."}
            </p>
          </div>
          <span className="handwriting">
            {ar ? "هو شايفها خطة كويسة." : "he thinks this is a solid plan."}
          </span>
        </div>
      </section>
    </>
  );
}
