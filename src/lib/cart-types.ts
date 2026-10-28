// Shapes returned by the quoteCart and getOrder server functions. Shared by client and server.

export type LineStatus = "ok" | "insufficient" | "sold_out" | "unavailable";

export interface QuoteLine {
  variantId: string;
  productSlug: string;
  nameEn: string;
  nameAr: string;
  size: string;
  image: { url: string; altEn: string; altAr: string } | null;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  status: LineStatus;
  // Most that can be ordered right now (stock, capped at the per-line limit); 0 if none.
  maxQuantity: number;
}

export interface CartQuote {
  lines: QuoteLine[];
  // Variant ids that no longer exist; the client drops them from the bag.
  removed: string[];
  subtotalCents: number;
  itemCount: number;
  // True only when every line exists, is active and has enough stock.
  orderable: boolean;
  currency: "EGP";
}

export interface OrderView {
  reference: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: number;
  customerName: string;
  phone: string;
  email: string | null;
  governorate: string;
  city: string;
  addressLine: string;
  notes: string | null;
  subtotalCents: number;
  shippingCents: number | null;
  currency: string;
  items: {
    nameEn: string;
    nameAr: string;
    size: string;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
}
