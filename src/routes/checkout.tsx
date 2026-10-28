import { useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, Truck } from "lucide-react";
import { useLanguage } from "@/components/snobi";
import { CartPanel } from "@/components/cart-panel";
import { lineProblem } from "@/lib/cart-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { cartQuoteKey } from "@/lib/cart";
import { deliveryRatesKey, loadDeliveryRates, useDeliveryRates } from "@/lib/delivery";
import { formatDeliveryEstimate, type PublicDeliveryRate } from "@/lib/delivery-rules";
import { formatMoney } from "@/lib/money";
import { placeOrder } from "@/lib/orders";
import {
  GOVERNORATES,
  checkoutSchema,
  governorateLabel,
  type CheckoutField,
  type PlaceOrderPayload,
  type PlaceOrderResult,
} from "@/lib/order-schema";
import { useCartStore } from "@/stores/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Snobi" },
      {
        name: "description",
        content:
          "Check your Snobi bag and enter delivery details. See the delivery fee for your governorate, then pay the total in cash on delivery.",
      },
      { property: "og:title", content: "Checkout — Snobi" },
      {
        property: "og:description",
        content: "One last look before Snobi’s questionable business makes a sale.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => loadDeliveryRates(),
  component: CheckoutPage,
});

type Values = Record<CheckoutField, string>;
const EMPTY: Values = {
  name: "",
  phone: "",
  email: "",
  governorate: "",
  city: "",
  addressLine: "",
  notes: "",
};
const FIELD_ORDER: CheckoutField[] = [
  "name",
  "phone",
  "email",
  "governorate",
  "city",
  "addressLine",
  "notes",
];

function errorText(code: string, ar: boolean): string {
  const messages: Record<string, [string, string]> = {
    name_required: ["Please enter your full name.", "اكتب اسمك بالكامل."],
    phone_invalid: [
      "Enter an Egyptian mobile number, like 01012345678 or +201012345678.",
      "اكتب رقم موبايل مصري، زي 01012345678 أو ‎+201012345678.",
    ],
    email_invalid: ["Enter a valid email, or leave it empty.", "اكتب إيميل صحيح، أو سيبه فاضي."],
    governorate_required: ["Choose your governorate.", "اختار المحافظة."],
    governorate_unavailable: [
      "We don’t deliver to this governorate yet. Choose another one.",
      "لسه مش بنوصّل للمحافظة دي. اختار محافظة تانية.",
    ],
    city_required: ["Enter your city or area.", "اكتب المدينة أو المنطقة."],
    address_required: [
      "Enter the street, building and apartment.",
      "اكتب الشارع ورقم العمارة والشقة.",
    ],
  };
  const pair = messages[code];
  if (pair) return ar ? pair[1] : pair[0];
  return ar ? "الكلام ده أطول من اللازم." : "That’s too long.";
}

function feeText(cents: number, ar: boolean) {
  return cents === 0 ? (ar ? "توصيل مجاني" : "Free delivery") : formatMoney(cents, ar);
}

function estimateText(rate: PublicDeliveryRate, ar: boolean) {
  const estimate = formatDeliveryEstimate(rate.minDays, rate.maxDays, ar);
  if (!estimate) return null;
  return ar ? `${estimate} بعد ما نأكد الطلب` : `${estimate} after we confirm your order`;
}

function deliveryNote(rate: PublicDeliveryRate, ar: boolean) {
  const fee = ar
    ? `مصاريف التوصيل: ${feeText(rate.feeCents, ar)}.`
    : `Delivery fee: ${feeText(rate.feeCents, ar)}.`;
  const estimate = estimateText(rate, ar);
  return estimate ? `${fee} ${ar ? "بيوصل عادةً في" : "Usually arrives in"} ${estimate}.` : fee;
}

function CheckoutPage() {
  const { ar } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { empty, lines, quote, updating, failed } = useCartQuote();
  const clearCart = useCartStore((s) => s.clear);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [result, setResult] = useState<Exclude<PlaceOrderResult, { ok: true }> | null>(null);
  const [feeChange, setFeeChange] = useState<{ governorate: string; from: number } | null>(null);
  const ratesQuery = useDeliveryRates(Route.useLoaderData());
  const rates = ratesQuery.data;
  const rateByGov = useMemo(
    () => new Map((rates ?? []).map((r) => [r.governorate, r] as const)),
    [rates],
  );
  const selectedRate = values.governorate ? rateByGov.get(values.governorate) : undefined;
  const deliveryPaused = rates !== undefined && rates.length === 0;
  const ratesUnavailable = rates === undefined;
  const formRef = useRef<HTMLFormElement>(null);
  // One key per checkout attempt: a retried submit (e.g. after a dropped connection) returns
  // the same order instead of creating a second one.
  const idempotencyKey = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: PlaceOrderPayload) => placeOrder({ data }),
    onSuccess: (res, variables) => {
      if (res.ok) {
        clearCart();
        queryClient.removeQueries({ queryKey: cartQuoteKey });
        void navigate({
          to: "/order-confirmation",
          search: { ref: res.reference, token: res.accessToken },
          replace: true,
        });
        return;
      }
      // A typed failure means nothing was written, so the next attempt gets a fresh key.
      idempotencyKey.current = null;
      setResult(res);
      const governorate = variables.customer.governorate;
      if (res.error === "delivery_fee_changed") {
        // Show the new fee straight away; the customer confirms by placing the order again.
        setFeeChange({ governorate, from: variables.expectedShippingCents });
        queryClient.setQueryData(deliveryRatesKey, (old: PublicDeliveryRate[] | undefined) =>
          old?.map((r) =>
            r.governorate === governorate ? { ...r, feeCents: res.shippingCents } : r,
          ),
        );
        void queryClient.invalidateQueries({ queryKey: deliveryRatesKey });
      } else if (res.error === "no_delivery") {
        void queryClient.invalidateQueries({ queryKey: deliveryRatesKey });
      } else {
        void queryClient.invalidateQueries({ queryKey: cartQuoteKey });
      }
    },
  });

  function update(field: CheckoutField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setResult(null);
    setFeeChange(null);
    const parsed = checkoutSchema.safeParse(values);
    const next: Partial<Record<CheckoutField, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as CheckoutField;
        next[field] ??= issue.message;
      }
    }
    if (values.governorate && rates && !selectedRate) next.governorate = "governorate_unavailable";
    if (!parsed.success || next.governorate) {
      setErrors(next);
      const first = FIELD_ORDER.find((f) => next[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#checkout-${first}`)?.focus();
      return;
    }
    setErrors({});
    if (!quote?.orderable || updating || !selectedRate) return;
    idempotencyKey.current ??= crypto.randomUUID();
    mutation.mutate({
      customer: parsed.data,
      lines,
      idempotencyKey: idempotencyKey.current,
      expectedShippingCents: selectedRate.feeCents,
    });
  }

  const field = (
    name: CheckoutField,
    label: string,
    options: {
      optional?: boolean;
      note?: string;
      wide?: boolean;
      input?: Partial<React.ComponentProps<typeof Input>>;
    } = {},
  ) => {
    const error = errors[name];
    const describedBy = [error && `checkout-${name}-error`, options.note && `checkout-${name}-note`]
      .filter(Boolean)
      .join(" ");
    return (
      <div className={`contact-field ${options.wide ? "contact-wide" : ""}`}>
        <label htmlFor={`checkout-${name}`}>
          {label}{" "}
          {options.optional ? (
            <span>{ar ? "(اختياري)" : "(optional)"}</span>
          ) : (
            <span aria-hidden="true">*</span>
          )}
        </label>
        <Input
          id={`checkout-${name}`}
          name={name}
          required={!options.optional}
          value={values[name]}
          onChange={(e) => update(name, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          {...options.input}
        />
        {options.note && (
          <p className="contact-field-note" id={`checkout-${name}-note`}>
            {options.note}
          </p>
        )}
        {error && (
          <p className="contact-error" id={`checkout-${name}-error`}>
            {errorText(error, ar)}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="cart-page page-width">
      <div className="shop-breadcrumb">
        <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> /{" "}
        <Link to="/cart">{ar ? "الشنطة" : "BAG"}</Link> / {ar ? "إتمام الطلب" : "CHECKOUT"}
      </div>
      <div className="cart-page-heading">
        <div>
          <span className="section-kicker">
            {ar ? "خطوة أخيرة. سنوبي متوتر." : "LAST STEP. SNOBI IS NERVOUS."}
          </span>
          <h1>{ar ? "هنوصلّك فين؟" : "WHERE TO?"}</h1>
        </div>
        <span className="handwriting">
          {ar ? "كاش عند الاستلام. ولا مليم دلوقتي." : "cash on delivery. not a pound now."}
        </span>
      </div>

      {empty || !quote ? (
        <CartPanel ar={ar} />
      ) : (
        <div className="checkout-layout">
          <form
            ref={formRef}
            className="checkout-form"
            noValidate
            onSubmit={submit}
            aria-busy={mutation.isPending}
            aria-describedby="checkout-cod-note"
          >
            <div className="checkout-cod" id="checkout-cod-note">
              <Truck aria-hidden="true" />
              <div>
                <strong>{ar ? "الدفع كاش عند الاستلام" : "CASH ON DELIVERY"}</strong>
                <p>
                  {ar
                    ? "مش هتدفع حاجة دلوقتي. هتدفع الإجمالي (الهدوم + مصاريف التوصيل) كاش لما الطلب يوصلك. هنكلمك أو نبعتلك واتساب نأكد الطلب قبل ما نشحن."
                    : "You pay nothing now. You pay the total (clothes + delivery fee) in cash when it arrives. We’ll call or WhatsApp you to confirm your order before shipping."}
                </p>
              </div>
            </div>
            <div className="contact-fields">
              {field("name", ar ? "الاسم بالكامل" : "Full name", {
                wide: true,
                input: { autoComplete: "name", maxLength: 100 },
              })}
              {field("phone", ar ? "رقم الموبايل" : "Mobile number", {
                note: ar
                  ? "هنكلمك عليه نأكد الطلب. ممكن واتساب."
                  : "We’ll use it to confirm your order. WhatsApp works too.",
                input: {
                  type: "tel",
                  inputMode: "tel",
                  autoComplete: "tel",
                  dir: "ltr",
                  maxLength: 20,
                  placeholder: "01XXXXXXXXX",
                },
              })}
              {field("email", ar ? "الإيميل" : "Email", {
                optional: true,
                input: { type: "email", autoComplete: "email", dir: "ltr", maxLength: 254 },
              })}
              <div className="contact-field">
                <label htmlFor="checkout-governorate">
                  {ar ? "المحافظة" : "Governorate"} <span aria-hidden="true">*</span>
                </label>
                <select
                  id="checkout-governorate"
                  name="governorate"
                  className="checkout-select"
                  required
                  value={values.governorate}
                  onChange={(e) => update("governorate", e.target.value)}
                  aria-invalid={Boolean(errors.governorate)}
                  aria-describedby={
                    [
                      errors.governorate && "checkout-governorate-error",
                      selectedRate && "checkout-governorate-note",
                    ]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                >
                  <option value="">{ar ? "اختار…" : "Choose…"}</option>
                  {GOVERNORATES.map((g) => {
                    const rate = rateByGov.get(g.value);
                    const name = ar ? g.ar : g.en;
                    const suffix =
                      rates === undefined
                        ? ""
                        : rate
                          ? feeText(rate.feeCents, ar)
                          : ar
                            ? "لسه مش بنوصّل"
                            : "no delivery yet";
                    return (
                      <option key={g.value} value={g.value} disabled={rates !== undefined && !rate}>
                        {suffix ? `${name} — ${suffix}` : name}
                      </option>
                    );
                  })}
                </select>
                {selectedRate && (
                  <p className="contact-field-note" id="checkout-governorate-note">
                    {deliveryNote(selectedRate, ar)}
                  </p>
                )}
                {errors.governorate && (
                  <p className="contact-error" id="checkout-governorate-error">
                    {errorText(errors.governorate, ar)}
                  </p>
                )}
              </div>
              {field("city", ar ? "المدينة / المنطقة" : "City / area", {
                input: { autoComplete: "address-level2", maxLength: 100 },
              })}
              {field("addressLine", ar ? "العنوان" : "Address", {
                wide: true,
                note: ar
                  ? "الشارع، رقم العمارة، الدور والشقة، وأي علامة مميزة."
                  : "Street, building, floor and apartment, plus any landmark.",
                input: { autoComplete: "street-address", maxLength: 300 },
              })}
              <div className="contact-field contact-wide">
                <label htmlFor="checkout-notes">
                  {ar ? "ملاحظات" : "Notes"} <span>{ar ? "(اختياري)" : "(optional)"}</span>
                </label>
                <Textarea
                  id="checkout-notes"
                  name="notes"
                  maxLength={500}
                  value={values.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? "checkout-notes-error" : undefined}
                />
                {errors.notes && (
                  <p className="contact-error" id="checkout-notes-error">
                    {errorText(errors.notes, ar)}
                  </p>
                )}
              </div>
            </div>
            <div aria-live="assertive" className="checkout-feedback">
              {deliveryPaused && (
                <div className="contact-feedback" role="status">
                  <strong>{ar ? "الطلبات واقفة مؤقتًا." : "ORDERS ARE PAUSED FOR NOW."}</strong>
                  <p>
                    {ar
                      ? "التوصيل لسه متظبطش، فمش بنستقبل طلبات دلوقتي. شنطتك محفوظة؛ ارجع بعدين."
                      : "Delivery isn’t set up yet, so orders are paused. Your bag is saved — check back soon."}
                  </p>
                </div>
              )}
              {ratesQuery.isError && !rates && (
                <div className="contact-feedback" role="alert">
                  <strong>
                    {ar ? "مش قادرين نجيب مصاريف التوصيل." : "WE COULDN’T LOAD DELIVERY FEES."}
                  </strong>
                  <p>
                    {ar
                      ? "محتاجينها عشان نوريك الإجمالي قبل ما تطلب."
                      : "We need them to show your total before you order."}
                  </p>
                  <Button type="button" variant="note" onClick={() => void ratesQuery.refetch()}>
                    {ar ? "حاول تاني" : "TRY AGAIN"}
                  </Button>
                </div>
              )}
              {result?.error === "delivery_fee_changed" && feeChange && (
                <div className="contact-feedback" role="alert">
                  <strong>
                    {ar
                      ? "مصاريف التوصيل اتغيرت. الطلب ما اتعملش لسه."
                      : "THE DELIVERY FEE CHANGED. YOUR ORDER WAS NOT PLACED YET."}
                  </strong>
                  <p>
                    {ar
                      ? `مصاريف التوصيل لـ${governorateLabel(feeChange.governorate, ar)} بقت ${formatMoney(result.shippingCents, ar)} بدل ${formatMoney(feeChange.from, ar)}. راجع الإجمالي، ولو موافق اضغط "أكّد الطلب" تاني.`
                      : `The delivery fee for ${governorateLabel(feeChange.governorate, ar)} is now ${formatMoney(result.shippingCents, ar)} (was ${formatMoney(feeChange.from, ar)}). Check the new total and place your order again to confirm.`}
                  </p>
                </div>
              )}
              {result?.error === "no_delivery" && (
                <div className="contact-feedback" role="alert">
                  <strong>{ar ? "الطلب ما اتعملش." : "YOUR ORDER WAS NOT PLACED."}</strong>
                  <p>
                    {ar
                      ? "وقفنا التوصيل للمحافظة دي من شوية. اختار محافظة تانية لو ينفع، أو ارجع بعدين."
                      : "We just stopped delivering to this governorate. Choose another one if you can, or check back later."}
                  </p>
                </div>
              )}
              {(result?.error === "out_of_stock" || result?.error === "unavailable") && (
                <div className="contact-feedback" role="alert">
                  <strong>{ar ? "الطلب ما اتعملش." : "YOUR ORDER WAS NOT PLACED."}</strong>
                  <p>
                    {result.error === "out_of_stock"
                      ? ar
                        ? "حد سبقك: في مقاسات مبقاش منها كفاية. حدّثنا الشنطة، راجعها وجرّب تاني."
                        : "Someone got there first: some sizes don’t have enough left. We’ve refreshed your bag — check it and try again."
                      : ar
                        ? "في منتج في الشنطة مبقاش متاح. راجع الشنطة وجرّب تاني."
                        : "Something in your bag is no longer available. Check your bag and try again."}
                  </p>
                </div>
              )}
              {mutation.isError && (
                <div className="contact-feedback" role="alert">
                  <strong>{ar ? "حصلت مشكلة." : "SOMETHING WENT WRONG."}</strong>
                  <p>
                    {ar
                      ? "مش متأكدين الطلب وصل. جرّب تاني — مش هيتكرر لو كان وصل."
                      : "We couldn’t confirm your order went through. Try again — it won’t be duplicated if it did."}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ink"
              type="submit"
              className="checkout-submit"
              disabled={
                mutation.isPending ||
                updating ||
                failed ||
                !quote.orderable ||
                ratesUnavailable ||
                deliveryPaused
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  {ar ? "بنسجّل الطلب…" : "PLACING ORDER…"}
                </>
              ) : (
                <>
                  {ar ? "أكّد الطلب (كاش عند الاستلام)" : "PLACE ORDER (CASH ON DELIVERY)"}
                  <ArrowUpRight aria-hidden="true" />
                </>
              )}
            </Button>
            {!quote.orderable && !updating && (
              <p className="note-red" role="status">
                {ar
                  ? "في حاجات في الشنطة محتاجة تتظبط الأول."
                  : "Some items in your bag need sorting out first."}{" "}
                <Link to="/cart">{ar ? "افتح الشنطة" : "Open your bag"}</Link>
              </p>
            )}
          </form>

          <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
            <h2 id="checkout-summary-title">{ar ? "طلبك" : "YOUR ORDER"}</h2>
            <ul className="checkout-items" aria-busy={updating}>
              {quote.lines.map((line) => {
                const problem = lineProblem(line, ar);
                return (
                  <li key={line.variantId}>
                    <div>
                      <strong>{ar ? line.nameAr : line.nameEn}</strong>
                      <span>
                        {ar ? "المقاس" : "Size"} {line.size} × {line.quantity}
                      </span>
                      {problem && <span className="note-red">{problem}</span>}
                    </div>
                    <span>{line.status === "ok" ? formatMoney(line.lineTotalCents, ar) : "—"}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="checkout-totals" aria-live="polite">
              <div>
                <dt>{ar ? "المجموع الفرعي" : "Subtotal"}</dt>
                <dd>{updating ? "…" : formatMoney(quote.subtotalCents, ar)}</dd>
              </div>
              <div>
                <dt>{ar ? "مصاريف التوصيل" : "Delivery fee"}</dt>
                <dd>
                  {ratesUnavailable
                    ? "…"
                    : deliveryPaused
                      ? ar
                        ? "متوقف مؤقتًا"
                        : "Paused"
                      : selectedRate
                        ? feeText(selectedRate.feeCents, ar)
                        : values.governorate
                          ? ar
                            ? "مش بنوصّل هناك لسه"
                            : "No delivery there yet"
                          : ar
                            ? "اختار المحافظة"
                            : "Choose your governorate"}
                </dd>
              </div>
              {selectedRate && estimateText(selectedRate, ar) && (
                <div>
                  <dt>{ar ? "مدة التوصيل المتوقعة" : "Estimated delivery"}</dt>
                  <dd>{estimateText(selectedRate, ar)}</dd>
                </div>
              )}
              <div className="checkout-total">
                <dt>{ar ? "الإجمالي اللي هتدفعه عند الاستلام" : "Total to pay on delivery"}</dt>
                <dd>
                  {selectedRate && !updating
                    ? formatMoney(quote.subtotalCents + selectedRate.feeCents, ar)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>{ar ? "الدفع" : "Payment"}</dt>
                <dd>{ar ? "كاش عند الاستلام" : "Cash on delivery"}</dd>
              </div>
            </dl>
            <p className="checkout-summary-note">
              {ar
                ? "مصاريف التوصيل مش بترجع لو رجّعت حاجة. "
                : "Delivery fees aren’t refunded if you return something. "}
              <Link to="/shipping">{ar ? "سياسة الاسترجاع" : "Returns policy"}</Link>
            </p>
            <Button variant="note" asChild>
              <Link to="/cart">
                {ar ? "عدّل الشنطة" : "EDIT YOUR BAG"}
                <ArrowUpRight />
              </Link>
            </Button>
          </aside>
        </div>
      )}
      <div className="cart-page-note">
        <p>
          {ar
            ? "بياناتك بتتسجل مع الطلب عشان نكلمك ونوصّله."
            : "Your details are saved with the order so we can contact you and deliver it."}
        </p>
        <p>
          {ar
            ? "شراء الهدوم بيدعم حكاية سنوبي الخيالية. مش تبرع خيري معفى من الضرائب."
            : "Clothing purchases support Snobi’s fictional story. Not a tax-deductible charity donation."}
        </p>
      </div>
    </section>
  );
}
