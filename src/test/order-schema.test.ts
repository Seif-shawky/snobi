import { describe, expect, it } from "vitest";
import { GOVERNORATES, checkoutSchema, normalizeEgyptPhone } from "@/lib/order-schema";

const valid = {
  name: "  Mona Ali ",
  phone: "010 1234 5678",
  email: "",
  governorate: "cairo",
  city: "Nasr City",
  addressLine: "12 Abbas El Akkad St, floor 3",
  notes: "  ",
};

describe("normalizeEgyptPhone", () => {
  it.each([
    ["01012345678", "01012345678"],
    ["+201112345678", "01112345678"],
    ["00201212345678", "01212345678"],
    ["201512345678", "01512345678"],
    ["+20 (101) 234-5678", "01012345678"],
    ["٠١٠١٢٣٤٥٦٧٨", "01012345678"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeEgyptPhone(input)).toBe(expected);
  });

  it.each(["01312345678", "0101234567", "010123456789", "1012345678", "+441012345678", "", "abc"])(
    "rejects %s",
    (input) => {
      expect(normalizeEgyptPhone(input)).toBeNull();
    },
  );
});

describe("checkoutSchema", () => {
  it("trims, normalises and drops empty optional fields", () => {
    const parsed = checkoutSchema.parse(valid);
    expect(parsed).toEqual({
      name: "Mona Ali",
      phone: "01012345678",
      governorate: "cairo",
      city: "Nasr City",
      addressLine: "12 Abbas El Akkad St, floor 3",
    });
    expect(parsed.email).toBeUndefined();
    expect(parsed.notes).toBeUndefined();
  });

  it("lower-cases a provided email and keeps notes", () => {
    const parsed = checkoutSchema.parse({
      ...valid,
      email: " Mona@Example.COM ",
      notes: "Ring twice",
    });
    expect(parsed.email).toBe("mona@example.com");
    expect(parsed.notes).toBe("Ring twice");
  });

  it("reports a code for every missing required field", () => {
    const result = checkoutSchema.safeParse({
      name: " ",
      phone: "123",
      email: "nope",
      governorate: "",
      city: "",
      addressLine: "",
    });
    expect(result.success).toBe(false);
    const codes = Object.fromEntries(
      (result.success ? [] : result.error.issues).map((i) => [i.path[0], i.message]),
    );
    expect(codes).toEqual({
      name: "name_required",
      phone: "phone_invalid",
      email: "email_invalid",
      governorate: "governorate_required",
      city: "city_required",
      addressLine: "address_required",
    });
  });

  it("only accepts the 27 governorates", () => {
    expect(GOVERNORATES).toHaveLength(27);
    expect(new Set(GOVERNORATES.map((g) => g.value)).size).toBe(27);
    expect(checkoutSchema.safeParse({ ...valid, governorate: "atlantis" }).success).toBe(false);
  });
});
