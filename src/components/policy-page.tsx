import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/components/snobi";
import { SNOBI_EMAIL } from "@/lib/contact-details";

export interface PolicySection {
  title: string;
  body: ReactNode;
}

// Shared layout for the privacy policy and terms: same editorial header as FAQ/shipping,
// then numbered plain-language sections.
export function PolicyPage({
  crumb,
  kicker,
  title,
  note,
  updated,
  sections,
}: {
  crumb: string;
  kicker: string;
  title: ReactNode;
  note: string;
  updated: string;
  sections: PolicySection[];
}) {
  const { ar } = useLanguage();
  return (
    <>
      <section className="faq-intro page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {crumb}
          </span>
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
        </div>
        <div className="faq-title">
          <span className="section-kicker">{kicker}</span>
          <h1>{title}</h1>
          <p className="handwriting">{note}</p>
        </div>
      </section>
      <section className="faq-answers page-width" aria-label={crumb}>
        <div className="faq-topline">
          <span>{updated}</span>
          <p>
            {ar ? "أسئلة؟ ابعتلنا على " : "Questions? Email "}
            <a href={`mailto:${SNOBI_EMAIL}`} dir="ltr">
              {SNOBI_EMAIL}
            </a>
          </p>
        </div>
        <ol className="legal-sections">
          {sections.map((section, i) => (
            <li key={section.title} className="legal-section">
              <span className="faq-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2>{section.title}</h2>
                <div className="legal-body">{section.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export function EmailLink() {
  return (
    <a href={`mailto:${SNOBI_EMAIL}`} dir="ltr">
      {SNOBI_EMAIL}
    </a>
  );
}
