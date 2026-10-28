import { describe, expect, it } from "vitest";
import {
  deliveryFormSchema,
  deliveryRowSchema,
  formatDeliveryEstimate,
  type DeliveryRowInput,
} from "@/lib/delivery-rules";
import { placeOrderSchema } from "@/lib/order-schema";
import { resolveDelivery } from "@/server/pricing";

const row = (over: Partial<DeliveryRowInput> = {}): DeliveryRowInput => ({
  governorate: "giza",
  active: true,
  fee: "60",
  minDays: "",
  maxDays: "",
  ...over,
});

const issues = (input: DeliveryRowInput) => {
  const result = deliveryRowSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => [i.path.join("."), i.message]);
};

describe("deliveryRowSchema", () => {
  it("parses fees in pounds to piastres and empty days to null", () => {
    expect(deliveryRowSchema.parse(row({ fee: " 60.50 " }))).toEqual({
      governorate: "giza",
      active: true,
      fee: 6050,
      minDays: null,
      maxDays: null,
    });
  });

  it("allows a free (0) fee and a day range", () => {
    expect(deliveryRowSchema.parse(row({ fee: "0", minDays: "2", maxDays: "4" }))).toMatchObject({
      fee: 0,
      minDays: 2,
      maxDays: 4,
    });
  });

  it("requires a fee only when delivery is on", () => {
    expect(issues(row({ fee: "" }))).toEqual([["fee", "Enter a fee to deliver here (0 = free)"]]);
    expect(deliveryRowSchema.parse(row({ active: false, fee: "" })).fee).toBeNull();
  });

  it.each(["-5", "abc", "60.555", "10000.01"])("rejects fee %s", (fee) => {
    expect(issues(row({ fee }))[0]?.[0]).toBe("fee");
  });

  it("checks days are whole, within 60, paired and ordered", () => {
    expect(issues(row({ minDays: "1.5", maxDays: "3" }))[0]?.[0]).toBe("minDays");
    expect(issues(row({ minDays: "1", maxDays: "61" }))[0]?.[0]).toBe("maxDays");
    expect(issues(row({ minDays: "0", maxDays: "0" }))[0]?.[0]).toBe("maxDays");
    expect(issues(row({ minDays: "2", maxDays: "" }))).toEqual([
      ["maxDays", "Fill in both min and max days, or leave both empty"],
    ]);
    expect(issues(row({ minDays: "5", maxDays: "3" }))).toEqual([
      ["maxDays", "Max days can't be less than min days"],
    ]);
  });

  it("rejects unknown governorates", () => {
    expect(issues(row({ governorate: "atlantis" as never }))[0]?.[0]).toBe("governorate");
  });
});

describe("deliveryFormSchema", () => {
  it("reports errors per row and rejects duplicates", () => {
    const result = deliveryFormSchema.safeParse({
      rows: [row(), row({ governorate: "cairo", fee: "" }), row()],
    });
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(["rows.1.fee", "rows.2.governorate"]);
  });
});

describe("formatDeliveryEstimate", () => {
  it("is null without an estimate", () => {
    expect(formatDeliveryEstimate(null, null, false)).toBeNull();
    expect(formatDeliveryEstimate(2, null, true)).toBeNull();
  });

  it("formats ranges and single days in both languages", () => {
    expect(formatDeliveryEstimate(2, 4, false)).toBe("2–4 days");
    expect(formatDeliveryEstimate(1, 1, false)).toBe("1 day");
    expect(formatDeliveryEstimate(2, 2, true)).toBe("يومين");
    expect(formatDeliveryEstimate(2, 4, true)).toBe("٢–٤ أيام");
  });
});

describe("resolveDelivery", () => {
  it("accepts the fee the customer saw", () => {
    expect(resolveDelivery({ feeCents: 6000, active: true }, 6000)).toEqual({
      ok: true,
      shippingCents: 6000,
    });
    expect(resolveDelivery({ feeCents: 0, active: true }, 0)).toEqual({
      ok: true,
      shippingCents: 0,
    });
  });

  it("rejects governorates without an active rate as no_delivery", () => {
    expect(resolveDelivery(null, 6000)).toEqual({ ok: false, error: "no_delivery" });
    expect(resolveDelivery(undefined, 0)).toEqual({ ok: false, error: "no_delivery" });
    expect(resolveDelivery({ feeCents: 6000, active: false }, 6000)).toEqual({
      ok: false,
      error: "no_delivery",
    });
  });

  it("returns the new fee when it changed since checkout loaded", () => {
    expect(resolveDelivery({ feeCents: 7500, active: true }, 6000)).toEqual({
      ok: false,
      error: "delivery_fee_changed",
      shippingCents: 7500,
    });
  });
});

describe("placeOrderSchema", () => {
  const base = {
    customer: {
      name: "Mona Ali",
      phone: "01012345678",
      governorate: "giza",
      city: "Dokki",
      addressLine: "12 Tahrir St, floor 3",
    },
    lines: [{ variantId: "v1", quantity: 1 }],
    idempotencyKey: "4f9a3c1e-2b7d-4e8a-9c6f-1a2b3c4d5e6f",
  };

  it("requires the delivery fee the customer saw", () => {
    expect(placeOrderSchema.safeParse(base).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, expectedShippingCents: -1 }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ ...base, expectedShippingCents: 6000 }).success).toBe(true);
  });
});
