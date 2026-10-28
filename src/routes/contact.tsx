import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Instagram, Mail, Send } from "lucide-react";
import { Mascot, useLanguage } from "@/components/snobi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/lib/contact";
import { SNOBI_EMAIL, SNOBI_INSTAGRAM_HANDLE, SNOBI_INSTAGRAM_URL } from "@/lib/contact-details";
import {
  CONTACT_LIMITS,
  contactFieldErrors,
  contactMessageSchema,
  type ContactField,
} from "@/lib/contact-schema";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Say Something. Snobi Is Listening. — Contact Snobi" },
      {
        name: "description",
        content:
          "Contact Snobi about clothes or an order. Send a message, email seifwork006@gmail.com or find us on Instagram @snobi.isbroke.",
      },
      { property: "og:title", content: "Say Something. Snobi Is Listening. — Contact Snobi" },
      {
        property: "og:description",
        content: "A small inbox for a broke dog. A human reads every message and replies by email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

type Status = "idle" | "sending" | "sent" | "rate-limited" | "failed";
const EMPTY = { name: "", email: "", orderReference: "", message: "", website: "" };
const FIELDS: readonly ContactField[] = ["name", "email", "orderReference", "message"];

function ContactPage() {
  const { ar } = useLanguage();
  const send = useServerFn(submitContactMessage);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<ContactField, true>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const labels = ar
    ? { name: "الاسم", email: "الإيميل", orderReference: "رقم الطلب", message: "الرسالة" }
    : { name: "Name", email: "Email", orderReference: "Order number", message: "Message" };
  const errorText: Record<ContactField, string> = ar
    ? {
        name: "اكتب اسمك.",
        email: "اكتب إيميل صحيح عشان نعرف نرد عليك.",
        orderReference: "رقم الطلب شكله كده: SNB-7K2QXD. أو سيبه فاضي.",
        message: `الرسالة لازم تكون من ${CONTACT_LIMITS.messageMin} لـ ${CONTACT_LIMITS.messageMax} حرف.`,
      }
    : {
        name: "Please enter your name.",
        email: "Please enter a valid email address so we can reply.",
        orderReference: "Order numbers look like SNB-7K2QXD. Or leave it empty.",
        message: `Messages need ${CONTACT_LIMITS.messageMin} to ${CONTACT_LIMITS.messageMax} characters.`,
      };

  function update(field: keyof typeof EMPTY, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    if (field !== "website") setErrors((previous) => ({ ...previous, [field]: undefined }));
    if (status !== "sending") setStatus("idle");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const parsed = contactMessageSchema.safeParse(values);
    if (!parsed.success) {
      const next = contactFieldErrors(parsed.error);
      setErrors(next);
      setStatus("idle");
      const first = FIELDS.find((field) => next[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#contact-${first}`)?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const result = await send({ data: values });
      if (result.ok) {
        setValues(EMPTY);
        setStatus("sent");
      } else {
        setStatus("rate-limited");
      }
    } catch {
      setStatus("failed");
    }
  }

  return (
    <>
      <section className="contact-intro page-width">
        <div className="story-topline">
          <span className="shop-breadcrumb">
            <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> / {ar ? "تواصل معانا" : "CONTACT"}
          </span>
          <span className="phase-label">{ar ? "المرحلة ٠" : "PHASE 0"}</span>
        </div>
        <div className="contact-title">
          <span className="section-kicker">
            {ar ? "بني آدم هيرد. مش الكلب." : "A HUMAN WILL ANSWER. NOT THE DOG."}
          </span>
          <h1>
            {ar ? (
              <>
                قول حاجة.
                <br />
                سنوبي سامعك.
              </>
            ) : (
              <>
                SAY SOMETHING.
                <br />
                SNOBI IS LISTENING.
              </>
            )}
          </h1>
          <p className="handwriting">
            {ar ? "لو عن فلوس، انتباهه هيزيد." : "especially if it’s about money."}
          </p>
        </div>
      </section>
      <section
        className="contact-layout page-width"
        aria-label={ar ? "تواصل مع سنوبي" : "Contact Snobi"}
      >
        <div className="contact-form-area">
          <div className="contact-section-heading">
            <h2>{ar ? "سيب رسالة." : "LEAVE A MESSAGE."}</h2>
            <span>{ar ? "بنرد بالإيميل" : "WE REPLY BY EMAIL"}</span>
          </div>
          <p className="contact-availability" id="contact-availability">
            {ar ? (
              <>
                رسالتك بتتحفظ عندنا وبني آدم بيقراها ويرد على الإيميل اللي هتكتبه. بنستخدم بياناتك
                عشان نرد عليك بس. التفاصيل في <Link to="/privacy">سياسة الخصوصية</Link>.
              </>
            ) : (
              <>
                Your message is stored for us, read by a human and answered at the email you give.
                We only use your details to reply. Details in the{" "}
                <Link to="/privacy">privacy policy</Link>.
              </>
            )}
          </p>
          <form
            ref={formRef}
            noValidate
            onSubmit={(e) => void submit(e)}
            aria-describedby="contact-availability"
          >
            <div className="contact-fields">
              {(["name", "email", "orderReference"] as const).map((field) => (
                <div
                  className={`contact-field ${field === "orderReference" ? "contact-wide" : ""}`}
                  key={field}
                >
                  <label htmlFor={`contact-${field}`}>
                    {labels[field]}{" "}
                    {field === "orderReference" ? (
                      <span>{ar ? "(اختياري، زي SNB-7K2QXD)" : "(optional, e.g. SNB-7K2QXD)"}</span>
                    ) : (
                      <span aria-hidden="true">*</span>
                    )}
                  </label>
                  <Input
                    id={`contact-${field}`}
                    name={field}
                    type={field === "email" ? "email" : "text"}
                    autoComplete={field === "name" ? "name" : field === "email" ? "email" : "off"}
                    dir={field === "email" || field === "orderReference" ? "ltr" : undefined}
                    required={field !== "orderReference"}
                    maxLength={
                      field === "orderReference"
                        ? 20
                        : field === "name"
                          ? CONTACT_LIMITS.name
                          : CONTACT_LIMITS.email
                    }
                    value={values[field]}
                    onChange={(event) => update(field, event.target.value)}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? `contact-${field}-error` : undefined}
                  />
                  {errors[field] && (
                    <p className="contact-error" id={`contact-${field}-error`}>
                      {errorText[field]}
                    </p>
                  )}
                </div>
              ))}
              <div className="contact-field contact-wide">
                <label htmlFor="contact-message">
                  {labels.message} <span aria-hidden="true">*</span>
                </label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  maxLength={CONTACT_LIMITS.messageMax}
                  value={values.message}
                  onChange={(event) => update("message", event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message
                      ? "contact-message-error contact-message-note"
                      : "contact-message-note"
                  }
                />
                <p id="contact-message-note" className="contact-field-note">
                  {ar
                    ? "متكتبش بيانات دفع أو كلمات سر."
                    : "Please don’t include payment details or passwords."}
                </p>
                {errors.message && (
                  <p className="contact-error" id="contact-message-error">
                    {errorText.message}
                  </p>
                )}
              </div>
              <div className="contact-trap" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={(event) => update("website", event.target.value)}
                />
              </div>
            </div>
            {status === "sent" && (
              <div className="contact-feedback contact-sent" role="status">
                <strong>{ar ? "رسالتك وصلت." : "MESSAGE RECEIVED."}</strong>
                <p>
                  {ar
                    ? "هنرد عليك على الإيميل اللي كتبته. سنوبي مش هو اللي هيرد. للأسف."
                    : "We’ll reply to the email you gave us. Snobi won’t be the one typing. Unfortunately."}
                </p>
              </div>
            )}
            {status === "rate-limited" && (
              <div className="contact-feedback" role="alert">
                <strong>{ar ? "رسايل كتير ورا بعض." : "THAT’S A LOT OF MESSAGES."}</strong>
                <p>
                  {ar
                    ? `رسالتك ما اتبعتتش. استنى ساعة وجرب تاني، أو ابعتلنا على ${SNOBI_EMAIL}.`
                    : `Your message was not sent. Wait an hour and try again, or email ${SNOBI_EMAIL}.`}
                </p>
              </div>
            )}
            {status === "failed" && (
              <div className="contact-feedback" role="alert">
                <strong>{ar ? "رسالتك ما اتبعتتش." : "YOUR MESSAGE WAS NOT SENT."}</strong>
                <p>
                  {ar
                    ? `حصلت مشكلة. كلامك لسه في النموذج، جرب تاني أو ابعتلنا على ${SNOBI_EMAIL}.`
                    : `Something went wrong. Your text is still in the form; try again or email ${SNOBI_EMAIL}.`}
                </p>
              </div>
            )}
            <Button variant="ink" type="submit" disabled={status === "sending"}>
              {status === "sending"
                ? ar
                  ? "بيتبعت…"
                  : "SENDING…"
                : ar
                  ? "إرسال الرسالة"
                  : "SEND MESSAGE"}
              <Send aria-hidden="true" />
            </Button>
          </form>
        </div>
        <aside className="contact-aside">
          <div className="contact-channels">
            <h2>{ar ? "أو من هنا." : "OR, OVER HERE."}</h2>
            <div>
              <Mail aria-hidden="true" />
              <div>
                <h3>{ar ? "الإيميل" : "EMAIL"}</h3>
                <p>
                  <a href={`mailto:${SNOBI_EMAIL}`} dir="ltr">
                    {SNOBI_EMAIL}
                  </a>
                </p>
              </div>
            </div>
            <div>
              <Instagram aria-hidden="true" />
              <div>
                <h3>INSTAGRAM</h3>
                <p>
                  <a href={SNOBI_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" dir="ltr">
                    {SNOBI_INSTAGRAM_HANDLE}
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="contact-dog">
            <Mascot className="contact-mascot" />
            <p className="handwriting">
              {ar
                ? "سنوبي مش شاطر في الرد على الإيميلات. عشان كده في حد تاني بيرد."
                : "snobi is bad at answering emails. so someone else does it."}
            </p>
          </div>
          <Button variant="note" asChild>
            <Link to="/faq">
              {ar ? "يمكن الإجابة هنا" : "MAYBE IT’S IN THE FAQ"}
              <ArrowUpRight />
            </Link>
          </Button>
        </aside>
      </section>
    </>
  );
}
