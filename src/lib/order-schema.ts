import { z } from "zod";

// Shared by the cart store, the checkout form (inline errors) and the server (placeOrder).
// Error messages are codes; the UI maps them to English/Arabic copy.

export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 30;

export const GOVERNORATES = [
  { value: "cairo", en: "Cairo", ar: "القاهرة" },
  { value: "giza", en: "Giza", ar: "الجيزة" },
  { value: "alexandria", en: "Alexandria", ar: "الإسكندرية" },
  { value: "qalyubia", en: "Qalyubia", ar: "القليوبية" },
  { value: "sharqia", en: "Sharqia", ar: "الشرقية" },
  { value: "dakahlia", en: "Dakahlia", ar: "الدقهلية" },
  { value: "gharbia", en: "Gharbia", ar: "الغربية" },
  { value: "monufia", en: "Monufia", ar: "المنوفية" },
  { value: "beheira", en: "Beheira", ar: "البحيرة" },
  { value: "kafr-el-sheikh", en: "Kafr El Sheikh", ar: "كفر الشيخ" },
  { value: "damietta", en: "Damietta", ar: "دمياط" },
  { value: "port-said", en: "Port Said", ar: "بورسعيد" },
  { value: "ismailia", en: "Ismailia", ar: "الإسماعيلية" },
  { value: "suez", en: "Suez", ar: "السويس" },
  { value: "faiyum", en: "Faiyum", ar: "الفيوم" },
  { value: "beni-suef", en: "Beni Suef", ar: "بني سويف" },
  { value: "minya", en: "Minya", ar: "المنيا" },
  { value: "asyut", en: "Asyut", ar: "أسيوط" },
  { value: "sohag", en: "Sohag", ar: "سوهاج" },
  { value: "qena", en: "Qena", ar: "قنا" },
  { value: "luxor", en: "Luxor", ar: "الأقصر" },
  { value: "aswan", en: "Aswan", ar: "أسوان" },
  { value: "red-sea", en: "Red Sea", ar: "البحر الأحمر" },
  { value: "new-valley", en: "New Valley", ar: "الوادي الجديد" },
  { value: "matrouh", en: "Matrouh", ar: "مطروح" },
  { value: "north-sinai", en: "North Sinai", ar: "شمال سيناء" },
  { value: "south-sinai", en: "South Sinai", ar: "جنوب سيناء" },
] as const;

export type Governorate = (typeof GOVERNORATES)[number]["value"];
const governorateValues = GOVERNORATES.map((g) => g.value) as [Governorate, ...Governorate[]];

export function governorateLabel(value: string, ar: boolean) {
  const match = GOVERNORATES.find((g) => g.value === value);
  return match ? (ar ? match.ar : match.en) : value;
}

// Accepts 01XXXXXXXXX, +201XXXXXXXXX, 00201XXXXXXXXX or 201XXXXXXXXX, with spaces, dashes,
// brackets or Arabic-Indic digits. Returns the local 11-digit form, or null if invalid.
export function normalizeEgyptPhone(raw: string): string | null {
  const digits = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-().]/g, "");
  let local = digits;
  if (local.startsWith("+20")) local = "0" + local.slice(3);
  else if (local.startsWith("0020")) local = "0" + local.slice(4);
  else if (local.startsWith("20") && local.length === 12) local = "0" + local.slice(2);
  return /^01[0125]\d{8}$/.test(local) ? local : null;
}

const optionalText = (max: number, code: string) =>
  z
    .string()
    .trim()
    .max(max, code)
    .optional()
    .transform((v) => (v ? v : undefined));

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "name_required").max(100, "name_too_long"),
  phone: z.string().transform((v, ctx) => {
    const phone = normalizeEgyptPhone(v);
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "phone_invalid" });
      return z.NEVER;
    }
    return phone;
  }),
  email: z
    .string()
    .trim()
    .max(254, "email_invalid")
    .optional()
    .transform((v) => (v ? v.toLowerCase() : undefined))
    .refine((v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "email_invalid"),
  governorate: z.enum(governorateValues, {
    errorMap: () => ({ message: "governorate_required" }),
  }),
  city: z.string().trim().min(2, "city_required").max(100, "city_too_long"),
  addressLine: z.string().trim().min(5, "address_required").max(300, "address_too_long"),
  notes: optionalText(500, "notes_too_long"),
});

export type CheckoutFormInput = z.input<typeof checkoutSchema>;
export type CheckoutDetails = z.output<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutFormInput;

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});
export type CartLineInput = z.infer<typeof cartLineSchema>;

export const cartLinesSchema = z.array(cartLineSchema).max(MAX_CART_LINES);

export const placeOrderSchema = z.object({
  customer: checkoutSchema,
  lines: cartLinesSchema.min(1),
  idempotencyKey: z.string().uuid(),
});
export type PlaceOrderInput = z.output<typeof placeOrderSchema>;
export type PlaceOrderPayload = z.input<typeof placeOrderSchema>;

export type PlaceOrderResult =
  | { ok: true; reference: string; accessToken: string }
  | { ok: false; error: "out_of_stock" | "unavailable"; variantIds: string[] };

export const REFERENCE_PATTERN = /^SNB-[A-Z0-9]{6}$/;
