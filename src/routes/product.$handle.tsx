import { useId, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/snobi";
import { productQuery, type CatalogProduct } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { MAX_LINE_QUANTITY } from "@/lib/order-schema";
import { useCartStore, type AddResult } from "@/stores/cart";
import mascot from "@/assets/snobi-original.jpg";

export const Route = createFileRoute("/product/$handle")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.handle)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.nameEn} — Snobi` : "Shirt Not Found — Snobi";
    const description =
      loaderData?.descriptionEn ||
      (loaderData
        ? `${loaderData.nameEn} by Snobi. Made in Egypt, paid cash on delivery.`
        : "This Snobi shirt could not be found.");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(handle));
  return <ProductDetail product={product} key={product.id} />;
}

function ProductDetail({ product }: { product: CatalogProduct }) {
  const { ar } = useLanguage();
  const addItem = useCartStore((s) => s.addItem);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState<AddResult | null>(null);
  const sizesRef = useRef<HTMLFieldSetElement>(null);
  const ids = useId();
  const name = ar ? product.nameAr : product.nameEn;
  const description = ar ? product.descriptionAr : product.descriptionEn;
  const selected = product.variants.find((v) => v.id === variantId) ?? null;
  const maxQuantity = Math.min(MAX_LINE_QUANTITY, selected?.lowStock ?? MAX_LINE_QUANTITY);
  const image = product.images[imageIndex] ?? product.images[0];
  const priceVaries = product.variants.some((v) => v.priceCents !== product.minPriceCents);

  function chooseSize(id: string) {
    const variant = product.variants.find((v) => v.id === id);
    setVariantId(id);
    setSizeError(false);
    setAdded(null);
    if (variant?.lowStock) setQuantity((q) => Math.min(q, variant.lowStock ?? q));
  }

  function add() {
    if (!selected) {
      setSizeError(true);
      setAdded(null);
      sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    if (!selected.available) return;
    setAdded(addItem(selected.id, quantity));
  }

  return (
    <section className="page-width standalone-section product-detail">
      <div className="shop-breadcrumb">
        <Link to="/">{ar ? "الرئيسية" : "HOME"}</Link> /{" "}
        <Link to="/shop">{ar ? "التيشيرتات" : "SHOP"}</Link> / {name}
      </div>
      <div className="product-layout">
        <div className="product-gallery">
          {image ? (
            <img
              className="product-gallery-main"
              src={image.url}
              alt={(ar ? image.altAr : image.altEn) || name}
            />
          ) : (
            <figure className="product-gallery-empty">
              <img className="mascot" src={mascot} alt="" />
              <figcaption className="handwriting">
                {ar ? "لسه مفيش صور. سنوبي مكسوف." : "no photos yet. snobi is camera-shy."}
              </figcaption>
            </figure>
          )}
          {product.images.length > 1 && (
            <div className="product-thumbs" aria-label={ar ? "صور المنتج" : "Product photos"}>
              {product.images.map((img, i) => (
                <button
                  type="button"
                  key={img.url}
                  className="product-thumb"
                  aria-pressed={i === imageIndex}
                  aria-label={
                    ar
                      ? `صورة ${i + 1} من ${product.images.length}`
                      : `Photo ${i + 1} of ${product.images.length}`
                  }
                  onClick={() => setImageIndex(i)}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1>{name}</h1>
          <p className="product-price" aria-live="polite">
            {selected
              ? formatMoney(selected.priceCents, ar)
              : product.minPriceCents !== null
                ? `${priceVaries ? (ar ? "من " : "From ") : ""}${formatMoney(product.minPriceCents, ar)}`
                : ar
                  ? "مفيش مقاسات متاحة"
                  : "No sizes listed"}
          </p>
          {description && <p className="product-description">{description}</p>}

          {product.variants.length > 0 && (
            <fieldset
              ref={sizesRef}
              className="product-sizes"
              aria-invalid={sizeError}
              aria-describedby={sizeError ? `${ids}-size-error` : undefined}
            >
              <legend>{ar ? "اختار المقاس" : "Choose a size"}</legend>
              <div className="product-size-options">
                {product.variants.map((v) => (
                  <label
                    key={v.id}
                    className="product-size"
                    data-checked={v.id === variantId || undefined}
                    data-disabled={!v.available || undefined}
                  >
                    <input
                      type="radio"
                      name={`${ids}-size`}
                      value={v.id}
                      checked={v.id === variantId}
                      disabled={!v.available}
                      onChange={() => chooseSize(v.id)}
                    />
                    <span>{v.size}</span>
                    {!v.available && (
                      <span className="product-size-note">{ar ? "خلص" : "sold out"}</span>
                    )}
                  </label>
                ))}
              </div>
              {sizeError && (
                <p className="contact-error" id={`${ids}-size-error`} role="alert">
                  {ar ? "اختار مقاس الأول." : "Pick a size first."}
                </p>
              )}
              {selected?.lowStock && (
                <p className="product-low-stock">
                  {ar
                    ? `فاضل ${selected.lowStock} بس من المقاس ده.`
                    : `Only ${selected.lowStock} left in this size.`}
                </p>
              )}
            </fieldset>
          )}

          {product.available ? (
            <>
              <div className="product-quantity">
                <span id={`${ids}-qty-label`}>{ar ? "الكمية" : "Quantity"}</span>
                <div className="cart-quantity" role="group" aria-labelledby={`${ids}-qty-label`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={ar ? "قلل الكمية" : "Decrease quantity"}
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus />
                  </Button>
                  <span aria-live="polite">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={ar ? "زوّد الكمية" : "Increase quantity"}
                    disabled={quantity >= maxQuantity}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <div className="product-actions">
                <Button variant="ink" onClick={add}>
                  <ShoppingBag />
                  {ar ? "ضيف للشنطة" : "ADD TO BAG"}
                </Button>
                <Button variant="note" asChild>
                  <Link to="/cart">
                    {ar ? "شوف الشنطة" : "VIEW YOUR BAG"}
                    <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="note-red product-sold-out">
              {ar
                ? "كل المقاسات خلصت. سنوبي في صدمة."
                : "Every size is sold out. Snobi is in shock."}
            </p>
          )}
          <div aria-live="polite" className="product-feedback">
            {added &&
              (added.quantity === 0 ? (
                <p className="note-red">
                  {ar
                    ? "الشنطة مليانة. خلّص اللي فيها الأول."
                    : "Your bag is full. Check out what’s in it first."}
                </p>
              ) : (
                <p>
                  {added.capped
                    ? ar
                      ? `الحد ${MAX_LINE_QUANTITY} من نفس المقاس. بقى عندك ${added.quantity} في الشنطة.`
                      : `Limit is ${MAX_LINE_QUANTITY} per size. You now have ${added.quantity} in your bag.`
                    : ar
                      ? `اتضاف للشنطة. عندك ${added.quantity} من المقاس ده.`
                      : `Added to your bag. You have ${added.quantity} in this size.`}
                </p>
              ))}
          </div>
          <p className="product-cod-note">
            {ar
              ? "الدفع كاش عند الاستلام. مصاريف التوصيل حسب المحافظة وبتظهرلك قبل ما تأكد الطلب."
              : "Cash on delivery. The delivery fee depends on your governorate and is shown before you order."}
          </p>
        </div>
      </div>
    </section>
  );
}
