import { useId } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { lineProblem } from "@/lib/cart-copy";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/stores/cart";
import mascot from "@/assets/snobi-original.jpg";

export function CartPanel({
  ar,
  compact = false,
  onNavigate,
}: {
  ar: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { hydrated, empty, quote, updating, failed, refetch } = useCartQuote();
  const reasonId = useId();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const removedNotice = useCartStore((s) => s.removedNotice);
  const dismissNotice = useCartStore((s) => s.dismissNotice);
  const notice = removedNotice && (
    <div className="cart-error" role="status">
      <p>
        {ar
          ? "شلنا من الشنطة حاجة مبقتش موجودة في المحل. آسفين."
          : "We removed something from your bag that no longer exists in the shop. Sorry."}
      </p>
      <Button
        variant="ghost"
        size="icon"
        aria-label={ar ? "اقفل الرسالة" : "Dismiss message"}
        onClick={dismissNotice}
      >
        <X />
      </Button>
    </div>
  );

  if (empty) {
    return (
      <div className={compact ? "cart-panel cart-panel-compact" : "cart-panel"}>
        {notice}
        <div className="cart-empty">
          <span className="cart-empty-label">
            <ShoppingBag aria-hidden="true" />
            {ar ? "٠ منتجات. آمال كتير." : "0 ITEMS. PLENTY OF HOPE."}
          </span>
          <img
            className="mascot cart-mascot"
            src={mascot}
            alt={ar ? "سنوبي، كلب مرسوم ومستني" : "Snobi, the original doodle of a dog, waiting"}
          />
          <h2>{ar ? "الشنطة فاضية.\nسنوبي مستني." : "NOTHING IN HERE.\nSNOBI IS WAITING."}</h2>
          <p>{ar ? "مفيش هدوم في شنطتك لسه." : "No clothes in your bag. Not even one."}</p>
          <Button variant="ink" asChild onClick={onNavigate}>
            <Link to="/shop">
              {ar ? "شوف التصميمات" : "SEE THE DESIGNS"}
              <ArrowUpRight />
            </Link>
          </Button>
          <span className="handwriting">
            {ar ? "اديله فرصة. بس." : "give him a chance. that’s all."}
          </span>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className={compact ? "cart-panel cart-panel-compact" : "cart-panel"}>
        {failed ? (
          <div className="cart-error" role="alert">
            <p>
              {ar
                ? "مش قادرين نتأكد من الأسعار دلوقتي. شنطتك لسه محفوظة."
                : "We couldn’t check prices right now. Your bag is still saved."}
            </p>
            <Button variant="note" onClick={() => void refetch()}>
              {ar ? "حاول تاني" : "TRY AGAIN"}
            </Button>
          </div>
        ) : (
          <p className="cart-loading" role="status">
            <Loader2 className="animate-spin" aria-hidden="true" />
            {hydrated
              ? ar
                ? "بنراجع الأسعار…"
                : "Checking prices…"
              : ar
                ? "بنفتح الشنطة…"
                : "Opening your bag…"}
          </p>
        )}
      </div>
    );
  }

  const blocked = updating || failed || !quote.orderable;
  const showReason = !updating && !failed && !quote.orderable;
  return (
    <div className={compact ? "cart-panel cart-panel-compact" : "cart-panel"}>
      {notice}
      {failed && (
        <div className="cart-error" role="alert">
          <p>
            {ar
              ? "مش قادرين نحدّث الأسعار. الأرقام اللي قدامك ممكن تكون قديمة."
              : "We couldn’t refresh prices. What you see may be out of date."}
          </p>
          <Button variant="note" onClick={() => void refetch()}>
            {ar ? "حاول تاني" : "TRY AGAIN"}
          </Button>
        </div>
      )}
      <div className="cart-filled" aria-busy={updating}>
        <div className="cart-lines">
          <div className="cart-table-heading">
            <span>{ar ? "الهدوم" : "THE CLOTHES"}</span>
            <span>{ar ? "الكمية / الإجمالي" : "QUANTITY / TOTAL"}</span>
          </div>
          {quote.lines.map((line) => {
            const name = ar ? line.nameAr : line.nameEn;
            const problem = lineProblem(line, ar);
            const canChange = line.status === "ok" || line.status === "insufficient";
            return (
              <article className="cart-line" key={line.variantId}>
                {line.image ? (
                  <img
                    className="cart-product-image"
                    src={line.image.url}
                    alt={(ar ? line.image.altAr : line.image.altEn) || name}
                  />
                ) : (
                  <img className="cart-product-image cart-product-fallback" src={mascot} alt="" />
                )}
                <div className="cart-line-copy">
                  <Link
                    to="/product/$handle"
                    params={{ handle: line.productSlug }}
                    onClick={onNavigate}
                  >
                    <h3>{name}</h3>
                  </Link>
                  <p>
                    {ar ? "المقاس" : "Size"}: {line.size} · {formatMoney(line.unitPriceCents, ar)}
                  </p>
                  {problem && <p className="note-red">{problem}</p>}
                  {line.status === "insufficient" && (
                    <Button
                      variant="note"
                      size="sm"
                      disabled={updating}
                      onClick={() => setQuantity(line.variantId, line.maxQuantity)}
                    >
                      {ar ? `خليها ${line.maxQuantity}` : `SET TO ${line.maxQuantity}`}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title={ar ? "احذف المنتج" : "Remove item"}
                    aria-label={`${ar ? "احذف" : "Remove"} ${name} (${line.size})`}
                    onClick={() => removeItem(line.variantId)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="cart-line-controls">
                  <strong>
                    {line.status === "ok"
                      ? formatMoney(line.lineTotalCents, ar)
                      : ar
                        ? "مش محسوب"
                        : "Not counted"}
                  </strong>
                  {canChange && (
                    <div
                      className="cart-quantity"
                      role="group"
                      aria-label={ar ? `كمية ${name}` : `Quantity of ${name}`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={ar ? "قلل الكمية" : "Decrease quantity"}
                        disabled={updating}
                        onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span aria-live="polite">{line.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={ar ? "زوّد الكمية" : "Increase quantity"}
                        disabled={updating || line.quantity >= line.maxQuantity}
                        onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <aside className="cart-summary">
          <span className="section-kicker">{ar ? "الحساب" : "THE DAMAGE"}</span>
          <div className="cart-subtotal">
            <span>{ar ? "المجموع الفرعي" : "Subtotal"}</span>
            <strong aria-live="polite">
              {updating ? (
                <Loader2 className="animate-spin" aria-label={ar ? "بنحسب" : "Updating"} />
              ) : (
                formatMoney(quote.subtotalCents, ar)
              )}
            </strong>
          </div>
          <p>
            {ar
              ? "الدفع كاش عند الاستلام. مصاريف التوصيل بتختلف حسب المحافظة وبتظهرلك في صفحة إتمام الطلب."
              : "Pay cash on delivery. Delivery fee depends on your governorate and is shown at checkout."}
          </p>
          {blocked ? (
            <Button variant="ink" disabled aria-describedby={showReason ? reasonId : undefined}>
              {ar ? "إتمام الطلب" : "CHECKOUT"}
              <ArrowUpRight />
            </Button>
          ) : (
            <Button variant="ink" asChild onClick={onNavigate}>
              <Link to="/checkout">
                {ar ? "إتمام الطلب" : "CHECKOUT"}
                <ArrowUpRight />
              </Link>
            </Button>
          )}
          {showReason && (
            <p id={reasonId} className="note-red" role="status">
              {ar ? "ظبط الحاجات المعلّم عليها الأول." : "Sort out the flagged items first."}
            </p>
          )}
          <span className="handwriting">
            {ar ? "قرار مالي مشكوك فيه." : "a questionable financial decision."}
          </span>
          <Button variant="note" asChild onClick={onNavigate}>
            <Link to="/shop">
              {ar ? "كمل تسوّق" : "CONTINUE SHOPPING"}
              <ArrowUpRight />
            </Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
