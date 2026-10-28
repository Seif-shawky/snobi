import { z } from "zod";
import { poundsToCents } from "./money";
import { GOVERNORATES, type Governorate } from "./order-schema";

// Pure, client-safe delivery rules shared by checkout, /shipping and /admin/delivery.

export const MAX_DELIVERY_FEE_CENTS = 1_000_000; // EGP 10,000
export const MAX_DELIVERY_DAYS = 60;

// What customers see: only active rates are ever sent to the storefront.
export interface PublicDeliveryRate {
  governorate: string;
  feeCents: number;
  minDays: number | null;
  maxDays: number | null;
}

const governorateValues = GOVERNORATES.map((g) => g.value) as [Governorate, ...Governorate[]];

const optionalDays = (label: string, min: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const n = /^\d+$/.test(value) ? Number(value) : NaN;
      if (!Number.isInteger(n) || n < min || n > MAX_DELIVERY_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be a whole number from ${min} to ${MAX_DELIVERY_DAYS}`,
        });
        return z.NEVER;
      }
      return n;
    });

export const deliveryRowSchema = z
  .object({
    governorate: z.enum(governorateValues),
    active: z.boolean(),
    fee: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (value === "") return null;
        const cents = poundsToCents(value);
        if (cents === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Enter the fee in EGP, e.g. 60 or 60.50 (0 = free)",
          });
          return z.NEVER;
        }
        if (cents > MAX_DELIVERY_FEE_CENTS) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Fee looks too high" });
          return z.NEVER;
        }
        return cents;
      }),
    minDays: optionalDays("Min days", 0),
    maxDays: optionalDays("Max days", 1),
  })
  .superRefine((row, ctx) => {
    if (row.active && row.fee === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fee"],
        message: "Enter a fee to deliver here (0 = free)",
      });
    }
    if ((row.minDays === null) !== (row.maxDays === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [row.minDays === null ? "minDays" : "maxDays"],
        message: "Fill in both min and max days, or leave both empty",
      });
    } else if (row.minDays !== null && row.maxDays !== null && row.minDays > row.maxDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDays"],
        message: "Max days can't be less than min days",
      });
    }
  });

export const deliveryFormSchema = z
  .object({ rows: z.array(deliveryRowSchema).max(GOVERNORATES.length) })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.rows.forEach((row, i) => {
      if (seen.has(row.governorate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rows", i, "governorate"],
          message: "This governorate is listed twice",
        });
      }
      seen.add(row.governorate);
    });
  });

export type DeliveryRowInput = z.input<typeof deliveryRowSchema>;
export type DeliveryRowOutput = z.output<typeof deliveryRowSchema>;
export type DeliveryFormInput = z.input<typeof deliveryFormSchema>;
export type DeliveryFormOutput = z.output<typeof deliveryFormSchema>;

const numberFormat = (ar: boolean) => new Intl.NumberFormat(ar ? "ar-EG" : "en-EG");

function arDays(n: number, fmt: Intl.NumberFormat) {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  return `${fmt.format(n)} ${n >= 3 && n <= 10 ? "أيام" : "يوم"}`;
}

// "2–4 days" / "٢–٤ أيام"; null when the owner set no estimate.
export function formatDeliveryEstimate(
  minDays: number | null,
  maxDays: number | null,
  ar: boolean,
): string | null {
  if (minDays === null || maxDays === null) return null;
  const fmt = numberFormat(ar);
  if (maxDays === 0) return ar ? "في نفس اليوم" : "Same day";
  if (minDays === maxDays) {
    return ar ? arDays(maxDays, fmt) : `${maxDays} ${maxDays === 1 ? "day" : "days"}`;
  }
  return ar
    ? `${fmt.format(minDays)}–${fmt.format(maxDays)} ${maxDays <= 10 ? "أيام" : "يوم"}`
    : `${minDays}–${maxDays} days`;
}
