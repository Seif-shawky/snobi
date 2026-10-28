import { describe, expect, it } from "vitest";
import {
  REFERENCE_ALPHABET,
  constantTimeEqual,
  generateAccessToken,
  generateReference,
} from "@/server/order-codes";
import { REFERENCE_PATTERN } from "@/lib/order-schema";

describe("order codes", () => {
  it("generates SNB- references from the unambiguous alphabet", () => {
    expect(REFERENCE_ALPHABET).not.toMatch(/[01ILOU]/);
    const refs = Array.from({ length: 500 }, generateReference);
    for (const ref of refs) {
      expect(ref).toMatch(REFERENCE_PATTERN);
      for (const ch of ref.slice(4)) expect(REFERENCE_ALPHABET).toContain(ch);
    }
    expect(new Set(refs).size).toBeGreaterThan(495);
  });

  it("generates long URL-safe access tokens", () => {
    const tokens = Array.from({ length: 100 }, generateAccessToken);
    for (const token of tokens) {
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    }
    expect(new Set(tokens).size).toBe(100);
  });

  it("compares tokens exactly", () => {
    const token = generateAccessToken();
    expect(constantTimeEqual(token, token)).toBe(true);
    expect(constantTimeEqual(token, token.slice(0, -1))).toBe(false);
    expect(constantTimeEqual(token, token.slice(0, -1) + (token.endsWith("A") ? "B" : "A"))).toBe(
      false,
    );
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("a", "")).toBe(false);
  });
});
