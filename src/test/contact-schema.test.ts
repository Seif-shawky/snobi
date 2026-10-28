import { describe, expect, it } from "vitest";
import {
  CONTACT_RATE_LIMIT,
  contactFieldErrors,
  contactMessageSchema,
  decideContactMessage,
} from "@/lib/contact-schema";

const valid = {
  name: "Mona",
  email: "mona@example.com",
  orderReference: "",
  message: "Hi, does the tee run large?",
  website: "",
};

describe("contactMessageSchema", () => {
  it("accepts a normal message and trims it", () => {
    const parsed = contactMessageSchema.parse({
      ...valid,
      name: "  Mona ",
      message: ` ${valid.message} `,
    });
    expect(parsed).toEqual({ ...valid, orderReference: null });
  });

  it("normalises an order reference and rejects malformed ones", () => {
    expect(
      contactMessageSchema.parse({ ...valid, orderReference: " snb-7k2qxd " }).orderReference,
    ).toBe("SNB-7K2QXD");
    for (const ref of ["SNB-123", "7K2QXD", "SNB-7K2QXD1", "ABC-7K2QXD"]) {
      expect(contactMessageSchema.safeParse({ ...valid, orderReference: ref }).success, ref).toBe(
        false,
      );
    }
  });

  it("enforces field limits", () => {
    const cases: [Partial<typeof valid>, string][] = [
      [{ name: " " }, "name"],
      [{ name: "x".repeat(101) }, "name"],
      [{ email: "not-an-email" }, "email"],
      [{ email: `${"a".repeat(195)}@x.com` }, "email"],
      [{ message: "too short" }, "message"],
      [{ message: "x".repeat(2001) }, "message"],
    ];
    for (const [patch, field] of cases) {
      const result = contactMessageSchema.safeParse({ ...valid, ...patch });
      expect(result.success).toBe(false);
      if (!result.success) expect(contactFieldErrors(result.error)).toHaveProperty(field, true);
    }
    expect(contactMessageSchema.safeParse({ ...valid, message: "x".repeat(2000) }).success).toBe(
      true,
    );
  });

  it("defaults the honeypot when a client leaves it out", () => {
    const { website: _website, ...rest } = valid;
    expect(contactMessageSchema.parse(rest).website).toBe("");
  });
});

describe("decideContactMessage", () => {
  it("silently drops messages that filled the honeypot", () => {
    expect(decideContactMessage({ honeypot: "http://spam.example", recentCount: 1 })).toBe("drop");
  });

  it("allows up to the hourly limit per IP, then refuses", () => {
    expect(decideContactMessage({ honeypot: "", recentCount: 1 })).toBe("store");
    expect(decideContactMessage({ honeypot: "", recentCount: CONTACT_RATE_LIMIT })).toBe("store");
    expect(decideContactMessage({ honeypot: "", recentCount: CONTACT_RATE_LIMIT + 1 })).toBe(
      "rate-limited",
    );
  });

  it("treats a whitespace-only honeypot as empty", () => {
    expect(decideContactMessage({ honeypot: "  ", recentCount: 1 })).toBe("store");
  });
});
