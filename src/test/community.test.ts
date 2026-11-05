import { describe, expect, it } from "vitest";
import { listPublicSupporters, type SupporterRow } from "@/lib/community-rules";
import { checkoutSchema } from "@/lib/order-schema";
import { phaseProgressPercent } from "@/lib/phase";

const row = (
  phone: string,
  supporterDisplay: SupporterRow["supporterDisplay"],
  supporterName: string | null = null,
): SupporterRow => ({ phone, supporterDisplay, supporterName });

describe("listPublicSupporters", () => {
  it("lists named and anonymous customers and skips hidden ones", () => {
    expect(
      listPublicSupporters([row("1", "named", "Bob"), row("2", "anonymous"), row("3", "hidden")]),
    ).toEqual([{ name: "Bob" }, { name: null }]);
  });

  it("uses each customer's newest choice, so a newer opt-out removes them", () => {
    expect(listPublicSupporters([row("1", "hidden"), row("1", "named", "Bob")])).toEqual([]);
    expect(listPublicSupporters([row("1", "named", "New"), row("1", "named", "Old")])).toEqual([
      { name: "New" },
    ]);
  });

  it("never exposes phone numbers", () => {
    expect(JSON.stringify(listPublicSupporters([row("01012345678", "anonymous")]))).not.toContain(
      "0101",
    );
  });
});

describe("phaseProgressPercent", () => {
  it("rounds down and caps at 100", () => {
    expect(phaseProgressPercent(0, 1000)).toBe(0);
    expect(phaseProgressPercent(999, 1000)).toBe(99);
    expect(phaseProgressPercent(5000, 1000)).toBe(100);
  });
});

describe("checkout supporter choice", () => {
  const base = {
    name: "Test Person",
    phone: "01012345678",
    governorate: "cairo",
    city: "Maadi",
    addressLine: "5 Test Street",
  };
  const codes = (input: object) => {
    const result = checkoutSchema.safeParse({ ...base, ...input });
    return result.success ? [] : result.error.issues.map((i) => i.message);
  };

  it("defaults to not being listed", () => {
    expect(checkoutSchema.parse(base).supporterDisplay).toBe("hidden");
  });

  it("requires a clean name only when listing by name", () => {
    expect(codes({ supporterDisplay: "named" })).toEqual(["supporter_name_required"]);
    expect(codes({ supporterDisplay: "named", supporterName: "a".repeat(41) })).toEqual([
      "supporter_name_too_long",
    ]);
    for (const supporterName of ["visit www.spam", "http://x", "a@b", "spam.com", "0101234567"]) {
      expect(codes({ supporterDisplay: "named", supporterName })).toEqual([
        "supporter_name_invalid",
      ]);
    }
    expect(codes({ supporterDisplay: "named", supporterName: "سنوبي فان" })).toEqual([]);
  });

  it("drops a typed name when the customer isn't listing by name", () => {
    const parsed = checkoutSchema.parse({
      ...base,
      supporterDisplay: "anonymous",
      supporterName: "Bob",
    });
    expect(parsed.supporterName).toBeUndefined();
  });
});
