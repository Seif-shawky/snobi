import { z } from "zod";
import { poundsToCents } from "./money";

// Pure, client-safe admin rules shared by the admin UI and the admin server functions.
// Keep this file free of server imports so it can be bundled for the browser and unit-tested.

export const ADMIN_PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type AdminProductStatus = (typeof ADMIN_PRODUCT_STATUSES)[number];

export const ADMIN_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export const LOW_STOCK_THRESHOLD = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const ORDER_TRANSITIONS: Record<AdminOrderStatus, readonly AdminOrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrder(from: AdminOrderStatus, to: AdminOrderStatus) {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function isAdminOrderStatus(value: string): value is AdminOrderStatus {
  return (ADMIN_ORDER_STATUSES as readonly string[]).includes(value);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function suggestSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// Identifies an image by its leading bytes; the browser-reported MIME type is not trusted.
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  const at = (i: number) => bytes[i] ?? -1;
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => at(i) === b)) return "image/png";
  const ascii = (start: number, text: string) =>
    [...text].every((ch, i) => at(start + i) === ch.charCodeAt(0));
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  return null;
}

export const IMAGE_EXTENSIONS: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const wholeNumber = (label: string, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number (0 or more)`)
    .transform(Number)
    .pipe(z.number().int().max(max, `${label} must be ${max} or less`));

export const variantFormSchema = z.object({
  id: z.string().max(64).optional(),
  size: z.string().trim().min(1, "Size is required").max(20, "Size must be 20 characters or less"),
  sku: z
    .string()
    .trim()
    .max(60, "SKU must be 60 characters or less")
    .transform((s) => s || null),
  price: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const cents = poundsToCents(value);
      if (cents === null || cents <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a price above 0 in EGP, e.g. 450 or 450.50",
        });
        return z.NEVER;
      }
      if (cents > 10_000_000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price looks too high" });
        return z.NEVER;
      }
      return cents;
    }),
  stock: wholeNumber("Stock", 100_000),
  active: z.boolean(),
});

export type VariantFormInput = z.input<typeof variantFormSchema>;

export const productFormSchema = z
  .object({
    nameEn: z.string().trim().min(1, "English name is required").max(120),
    nameAr: z.string().trim().min(1, "Arabic name is required").max(120),
    slug: z
      .string()
      .trim()
      .min(1, "Web address is required")
      .max(80, "Keep the web address under 80 characters")
      .regex(SLUG_PATTERN, "Use only lowercase letters, numbers and single dashes (e.g. red-tee)"),
    descriptionEn: z.string().trim().max(4000),
    descriptionAr: z.string().trim().max(4000),
    status: z.enum(ADMIN_PRODUCT_STATUSES),
    phase: wholeNumber("Phase", 99),
    sortOrder: wholeNumber("Sort order", 9999),
    variants: z.array(variantFormSchema).max(30, "Up to 30 sizes per product"),
  })
  .superRefine((value, ctx) => {
    if (value.status === "active" && !value.variants.some((v) => v.active)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Add at least one active size before making this product active.",
      });
    }
    const seen = new Set<string>();
    value.variants.forEach((v, i) => {
      const key = v.size.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants", i, "size"],
          message: "This size is listed twice",
        });
      }
      seen.add(key);
    });
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

export type FieldErrors = Record<string, string>;

// Flattens zod issues to "variants.0.price"-style keys, keeping the first message per field.
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

export function centsToPoundsInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

// Egyptian mobile numbers are stored as typed by customers (e.g. 010..., +20 10...).
export function whatsappUrl(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(2);
  if (digits.startsWith("20") && digits.length === 12) return `https://wa.me/${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `https://wa.me/20${digits.slice(1)}`;
  if (digits.startsWith("1") && digits.length === 10) return `https://wa.me/20${digits}`;
  return null;
}

// Order times are shown in Cairo time regardless of where the owner's phone is set.
export const adminDateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Cairo",
});
