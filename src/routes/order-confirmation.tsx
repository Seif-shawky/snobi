import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/snobi";
import type { OrderView } from "@/lib/cart-types";
import { formatMoney } from "@/lib/money";
import { governorateLabel } from "@/lib/order-schema";
import { orderLookupSchema, orderQuery } from "@/lib/orders";
import mascot from "@/assets/snobi-original.jpg";

const searchSchema = z.object({
  ref: z.string().max(20).catch(""),
  token: z.string().max(128).catch(""),
});

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ ref: search.ref, token: search.token }),
  loader: async ({ context, deps }) => {
    if (!orderLookupSchema.safeParse({ reference: deps.ref, token: deps.token }).success) return;
    await context.queryClient.ensureQueryData(orderQuery(deps.ref, deps.token));
  },
  head: () => ({
    meta: [
      { title: "Order Confirmation — Snobi" },
      {
        name: "description",
        content: "Your Snobi order: items, delivery fee and the total to pay cash on delivery.",
      },
      // The URL carries a private access token: keep it out of search engines and referrers.
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
      { property: "og:title", content: "Order Confirmation — Snobi" },
      {
        property: "og:description",
        content: "Snobi got an order. He is pretending to be calm about it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { ref, token } = Route.useSearch();
  const valid = orderLookupSchema.safeParse({ reference: ref, token }).success;
  return (
    <section className="cart-page page-width confirm-page">
      {valid ? <OrderLookup reference={ref} token={token} /> : <OrderNotFound />}
    </section>
  );
}

function OrderLookup({ reference, token }: { reference: string; token: string }) {
  const { data } = useSuspenseQuery(orderQuery(reference, token));
  return data ? <OrderDetails order={data} /> : <OrderNotFound />;
}

function OrderNotFound() {
  const { ar } = useLanguage();
  return (
    <div className="cart-empty">
      <span className="section-kicker">{ar ? "تأكيد الطلب" : "ORDER CONFIRMATION"}</span>
      <img className="mascot cart-mascot" src={mascot} alt="" />
      <h1>{ar ? "مش لاقيين الطلب ده." : "WE CAN’T FIND THAT ORDER."}</h1>
      <p>
        {ar
          ? "اللينك ناقص أو غلط. استخدم اللينك الكامل اللي ظهرلك بعد ما أكدت الطلب."
          : "The link is incomplete or wrong. Use the full link shown after you placed your order."}
      </p>
      <Button variant="ink" asChild>
        <Link to="/shop">
          {ar ? "ارجع للمحل" : "BACK TO THE SHOP"}
          <ArrowUpRight />
        </Link>
      </Button>
    </div>
  );
}

function statusCopy(status: OrderView["status"], phone: string, feeKnown: boolean, ar: boolean) {
  switch (status) {
    case "pending":
      if (!feeKnown) {
        // Orders placed before delivery fees were set per governorate.
        return ar
          ? `استلمنا الطلب. هنكلمك أو نبعتلك واتساب على ${phone} نأكد الطلب ومصاريف التوصيل قبل الشحن.`
          : `We’ve received it. We’ll call or WhatsApp you on ${phone} to confirm your order and the delivery fee before shipping.`;
      }
      return ar
        ? `استلمنا الطلب. هنكلمك أو نبعتلك واتساب على ${phone} نأكد الطلب قبل الشحن.`
        : `We’ve received it. We’ll call or WhatsApp you on ${phone} to confirm your order before shipping.`;
    case "confirmed":
      return ar ? "الطلب اتأكد وبنجهّزه." : "Your order is confirmed and being prepared.";
    case "shipped":
      return ar ? "الطلب في الطريق." : "Your order is on its way.";
    case "delivered":
      return ar ? "الطلب اتسلّم." : "Your order was delivered.";
    case "cancelled":
      return ar
        ? "الطلب اتلغى. مفيش حاجة مطلوبة منك."
        : "This order was cancelled. Nothing to pay.";
  }
}

function OrderDetails({ order }: { order: OrderView }) {
  const { ar } = useLanguage();
  const statusLabel = {
    pending: ar ? "مستني التأكيد" : "AWAITING CONFIRMATION",
    confirmed: ar ? "اتأكد" : "CONFIRMED",
    shipped: ar ? "اتشحن" : "SHIPPED",
    delivered: ar ? "اتسلّم" : "DELIVERED",
    cancelled: ar ? "اتلغى" : "CANCELLED",
  }[order.status];
  const payment =
    order.status === "cancelled"
      ? ar
        ? "كاش عند الاستلام — مفيش حاجة تتدفع"
        : "Cash on delivery — nothing to pay"
      : order.status === "delivered"
        ? ar
          ? "كاش عند الاستلام"
          : "Cash on delivery"
        : ar
          ? "كاش عند الاستلام — لسه مدفعتش حاجة"
          : "Cash on delivery — nothing paid yet";
  return (
    <div className="order-confirmation">
      <div className="order-confirmation-head">
        <img className="mascot cart-mascot" src={mascot} alt="" />
        <div>
          <span className="section-kicker">{ar ? "رقم الطلب" : "ORDER REFERENCE"}</span>
          <p className="order-reference" dir="ltr">
            {order.reference}
          </p>
          <h1>
            {order.status === "pending"
              ? ar
                ? "شكرًا.\nسنوبي مصدّقش."
                : "THANK YOU.\nSNOBI CAN’T BELIEVE IT."
              : ar
                ? "طلبك."
                : "YOUR ORDER."}
          </h1>
          <p className="order-status">
            <span className="policy-status">{statusLabel}</span>{" "}
            {statusCopy(order.status, order.phone, order.shippingCents !== null, ar)}
          </p>
          <p className="handwriting">
            {ar ? "احتفظ باللينك ده عشان ترجع للطلب." : "keep this link to check your order later."}
          </p>
        </div>
      </div>

      <div className="checkout-layout">
        <section className="checkout-summary" aria-labelledby="order-items-title">
          <h2 id="order-items-title">{ar ? "الهدوم" : "THE CLOTHES"}</h2>
          <ul className="checkout-items">
            {order.items.map((item, i) => (
              <li key={i}>
                <div>
                  <strong>{ar ? item.nameAr : item.nameEn}</strong>
                  <span>
                    {ar ? "المقاس" : "Size"} {item.size} × {item.quantity} ·{" "}
                    {formatMoney(item.unitPriceCents, ar, order.currency)}
                  </span>
                </div>
                <span>{formatMoney(item.lineTotalCents, ar, order.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="checkout-totals">
            <div>
              <dt>{ar ? "المجموع الفرعي" : "Subtotal"}</dt>
              <dd>{formatMoney(order.subtotalCents, ar, order.currency)}</dd>
            </div>
            <div>
              <dt>{ar ? "مصاريف التوصيل" : "Delivery fee"}</dt>
              <dd>
                {order.shippingCents === null
                  ? ar
                    ? "هيتأكد معاك"
                    : "To be confirmed"
                  : order.shippingCents === 0
                    ? ar
                      ? "توصيل مجاني"
                      : "Free delivery"
                    : formatMoney(order.shippingCents, ar, order.currency)}
              </dd>
            </div>
            <div className="checkout-total">
              <dt>
                {order.status === "cancelled"
                  ? ar
                    ? "الإجمالي"
                    : "Total"
                  : ar
                    ? "الإجمالي اللي هتدفعه عند الاستلام"
                    : "Total to pay on delivery"}
              </dt>
              <dd>
                {order.shippingCents === null
                  ? ar
                    ? "المجموع + التوصيل (هيتأكد)"
                    : "Subtotal + delivery (to be confirmed)"
                  : formatMoney(order.subtotalCents + order.shippingCents, ar, order.currency)}
              </dd>
            </div>
            <div>
              <dt>{ar ? "الدفع" : "Payment"}</dt>
              <dd>{payment}</dd>
            </div>
          </dl>
          <p className="checkout-summary-note">
            {ar
              ? "مصاريف التوصيل مش بترجع لو رجّعت حاجة. "
              : "Delivery fees aren’t refunded if you return something. "}
            <Link to="/shipping">{ar ? "سياسة الاسترجاع" : "Returns policy"}</Link>
          </p>
        </section>

        <section className="checkout-summary" aria-labelledby="order-delivery-title">
          <h2 id="order-delivery-title">{ar ? "هنوصّل لـ" : "DELIVERING TO"}</h2>
          <dl className="order-delivery">
            <div>
              <dt>{ar ? "الاسم" : "Name"}</dt>
              <dd>{order.customerName}</dd>
            </div>
            <div>
              <dt>{ar ? "الموبايل" : "Mobile"}</dt>
              <dd dir="ltr">{order.phone}</dd>
            </div>
            {order.email && (
              <div>
                <dt>{ar ? "الإيميل" : "Email"}</dt>
                <dd dir="ltr">{order.email}</dd>
              </div>
            )}
            <div>
              <dt>{ar ? "العنوان" : "Address"}</dt>
              <dd>
                {order.addressLine}
                <br />
                {order.city}
                {ar ? "، " : ", "}
                {governorateLabel(order.governorate, ar)}
              </dd>
            </div>
            {order.notes && (
              <div>
                <dt>{ar ? "ملاحظات" : "Notes"}</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
          </dl>
          <Button variant="note" asChild>
            <Link to="/story">
              {ar ? "اقرا حكايته وإنت مستني" : "READ HIS STORY WHILE YOU WAIT"}
              <ArrowUpRight />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
