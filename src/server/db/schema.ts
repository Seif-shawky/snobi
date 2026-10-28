import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Money is stored as integer piastres (1 EGP = 100) to avoid float rounding.
// Timestamps are Unix epoch milliseconds.

const timestamps = {
  createdAt: integer("created_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    // Only "active" products are visible in the storefront.
    status: text("status", { enum: PRODUCT_STATUSES }).notNull().default("draft"),
    // Story phase this drop belongs to (Phase 0 = launch).
    phase: integer("phase").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug), index("products_status_idx").on(t.status)],
);

export const variants = sqliteTable(
  "variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Size label shown to customers, e.g. "S", "M", "XL".
    size: text("size").notNull(),
    sku: text("sku"),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("variants_product_idx").on(t.productId),
    // Order placement decrements stock inside a D1 batch; this check makes an oversell
    // fail the whole batch instead of going negative.
    check("variants_stock_nonnegative", sql`${t.stock} >= 0`),
    check("variants_price_positive", sql`${t.priceCents} > 0`),
  ],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Object key inside the IMAGES R2 bucket; served by /images/$key.
    r2Key: text("r2_key").notNull(),
    altEn: text("alt_en").notNull().default(""),
    altAr: text("alt_ar").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    // Short human-readable reference shown to the customer, e.g. "SNB-7K2QXD".
    reference: text("reference").notNull(),
    // Random secret in the confirmation URL so references can't be enumerated.
    accessToken: text("access_token").notNull(),
    // Client-generated key; a retried submit returns the existing order instead of a duplicate.
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
    paymentMethod: text("payment_method", { enum: ["cod"] })
      .notNull()
      .default("cod"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    governorate: text("governorate").notNull(),
    city: text("city").notNull(),
    addressLine: text("address_line").notNull(),
    notes: text("notes"),
    subtotalCents: integer("subtotal_cents").notNull(),
    // Null until the delivery fee is confirmed with the customer.
    shippingCents: integer("shipping_cents"),
    currency: text("currency").notNull().default("EGP"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_reference_idx").on(t.reference),
    uniqueIndex("orders_idempotency_idx").on(t.idempotencyKey),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Snapshot fields keep the order readable if the product is later edited or deleted.
    productId: text("product_id"),
    variantId: text("variant_id"),
    productNameEn: text("product_name_en").notNull(),
    productNameAr: text("product_name_ar").notNull(),
    size: text("size").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

// Failed admin logins, used for rate limiting.
export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ip: text("ip").notNull(),
    attemptedAt: integer("attempted_at", { mode: "number" }).notNull(),
  },
  (t) => [index("login_attempts_ip_idx").on(t.ip, t.attemptedAt)],
);

// Delivery fee per governorate, managed in /admin/delivery. Keys match GOVERNORATES values in
// src/lib/order-schema.ts. A governorate without an active row cannot be ordered to.
export const deliveryRates = sqliteTable(
  "delivery_rates",
  {
    governorate: text("governorate").primaryKey(),
    feeCents: integer("fee_cents").notNull(),
    // Optional estimate shown to customers, in days after the order is confirmed.
    minDays: integer("min_days"),
    maxDays: integer("max_days"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [check("delivery_rates_fee_nonnegative", sql`${t.feeCents} >= 0`)],
);

// Small key/value store for owner-editable site content (e.g. the homepage hero image).
export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamps.updatedAt,
});

export const contactMessages = sqliteTable(
  "contact_messages",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    orderReference: text("order_reference"),
    message: text("message").notNull(),
    // Used only for rate limiting; cleared when the message is deleted.
    ip: text("ip"),
    readAt: integer("read_at", { mode: "number" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("contact_messages_created_idx").on(t.createdAt)],
);
