// Pure, client-safe rules for customer accounts, used by the forms and the server.
import { z } from "zod";
import { DONATION_STATUSES } from "@/lib/community-rules";
import { normalizeEgyptPhone } from "@/lib/order-schema";

export type OrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned";

export const MIN_PASSWORD_LENGTH = 8;

// Public text, so no links, email addresses or phone numbers.
const PUBLIC_TEXT_FORBIDDEN = /https?:|www\.|@|\.[a-z]{2,}\b|\d{5,}/i;

const publicText = (min: number, max: number, code: string) =>
  z
    .string()
    .trim()
    .min(min, `${code}_required`)
    .max(max, `${code}_too_long`)
    .refine((v) => !PUBLIC_TEXT_FORBIDDEN.test(v), `${code}_invalid`);

export const displayNameSchema = publicText(2, 30, "display_name").refine(
  // The original is one of a kind.
  (v) => v.toLowerCase() !== "snobi" && v !== "سنوبي",
  "display_name_taken",
);

export const titleSchema = z
  .union([z.literal(""), publicText(2, 40, "title")])
  .optional()
  .transform((v) => (v ? v : null));

export const phoneSchema = z.string().transform((v, ctx) => {
  const phone = normalizeEgyptPhone(v);
  if (!phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "phone_invalid" });
    return z.NEVER;
  }
  return phone;
});

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, "password_too_short")
  .max(128, "password_too_long");

export const snobiOptionIdSchema = z.string().min(1, "snobi_required").max(64);

export const registerSchema = z.object({
  snobiOptionId: snobiOptionIdSchema,
  displayName: displayNameSchema,
  title: titleSchema,
  phone: phoneSchema,
  password: passwordSchema,
  isPublic: z.boolean(),
});
export type RegisterPayload = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;

export const loginSchema = z.object({
  phone: phoneSchema,
  // No length rule here: the check is only whether it matches.
  password: z.string().min(1, "password_required").max(128),
});
export type LoginPayload = z.input<typeof loginSchema>;
export type LoginInput = z.output<typeof loginSchema>;

export const profileSchema = z.object({
  snobiOptionId: snobiOptionIdSchema,
  displayName: displayNameSchema,
  title: titleSchema,
  isPublic: z.boolean(),
});
export type ProfilePayload = z.input<typeof profileSchema>;

export const TITLE_SUGGESTIONS = {
  en: ["Snobi’s Financial Advisor", "Enabler of the Month", "Sponsor of Questionable Decisions"],
  ar: ["مستشار سنوبي المالي", "متواطئ الشهر", "راعي القرارات المشكوك فيها"],
} as const;

export type AccountResult = { ok: true } | { ok: false; error: AccountError };
export type AccountError =
  "phone_taken" | "bad_credentials" | "too_many_attempts" | "snobi_unavailable";

const BUILTIN_PREFIX = "builtin:";

// "builtin:<name>" lives in public/snobis; anything else is an R2 key served by /images.
export function snobiImageUrl(imageKey: string) {
  return imageKey.startsWith(BUILTIN_PREFIX)
    ? `/snobis/${imageKey.slice(BUILTIN_PREFIX.length)}.png`
    : `/images/${imageKey}`;
}

// What the public sees of an account: never its id or phone number.
export interface PublicSnobi {
  displayName: string;
  title: string | null;
  imageUrl: string;
  // Transparent layers for items they received and chose to wear, bottom first.
  wornUrls: string[];
}

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "password_required").max(128),
  newPassword: passwordSchema,
});
export type ChangePasswordPayload = z.input<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "password_required").max(128),
});

export const setWornSchema = z.object({
  productId: z.string().min(1).max(64),
  worn: z.boolean(),
});

// Where /join sends people afterwards. Only these two, so the link can't point anywhere else.
export function joinRedirectTarget(value: unknown): "/checkout" | "/account" {
  return value === "checkout" ? "/checkout" : "/account";
}

export interface SnobiOption {
  id: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string;
}

// The logged-in customer, only ever sent to themselves.
export interface SessionUser {
  phone: string;
  displayName: string;
  title: string | null;
  isPublic: boolean;
  hiddenByAdmin: boolean;
  snobiOptionId: string;
  snobiImageUrl: string;
  wornUrls: string[];
}

export interface WardrobeRow {
  productId: string | null;
  nameEn: string;
  nameAr: string;
  wearableKey: string | null;
  status: OrderStatus;
}

export interface WardrobeItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  overlayUrl: string;
  worn: boolean;
}

// What a customer can put on: products delivered to them that the shop made wearable. Buying the
// same thing twice lists it once, and it stays as long as one delivered order still has it.
export function buildWardrobe(rows: WardrobeRow[], wornIds: ReadonlySet<string>): WardrobeItem[] {
  const items = new Map<string, WardrobeItem>();
  for (const row of rows) {
    if (row.status !== "delivered" || !row.productId || !row.wearableKey) continue;
    items.set(row.productId, {
      productId: row.productId,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      overlayUrl: `/images/${row.wearableKey}`,
      worn: wornIds.has(row.productId),
    });
  }
  return [...items.values()];
}

export function totalDonations(orders: { status: OrderStatus; donations: number }[]) {
  return orders.reduce(
    (sum, o) =>
      (DONATION_STATUSES as readonly OrderStatus[]).includes(o.status) ? sum + o.donations : sum,
    0,
  );
}

export interface AccountOrder {
  reference: string;
  accessToken: string;
  status: OrderStatus;
  subtotalCents: number;
  donations: number;
  createdAt: number;
}

export interface MyAccount {
  user: SessionUser;
  donations: number;
  orders: AccountOrder[];
  wardrobe: WardrobeItem[];
}
