import { describe, expect, it } from "vitest";
import {
  SESSION_TTL_MS,
  adminConfigProblem,
  passwordMatches,
  signSession,
  verifySession,
} from "@/server/admin/session";

const secret = "x".repeat(32) + "-test-session-secret";

describe("admin session cookie", () => {
  it("verifies a freshly signed session", async () => {
    const token = await signSession(secret, Date.now() + SESSION_TTL_MS);
    expect(await verifySession(secret, token)).toBe(true);
  });

  it("rejects expired sessions", async () => {
    const now = Date.now();
    const token = await signSession(secret, now - 1);
    expect(await verifySession(secret, token, now)).toBe(false);
  });

  it("rejects a tampered expiry or signature", async () => {
    const expires = Date.now() + 1000;
    const token = await signSession(secret, expires);
    const [, sig] = token.split(".");
    expect(await verifySession(secret, `${expires + SESSION_TTL_MS}.${sig}`)).toBe(false);
    // Flip a middle character: the last base64url char carries 2 padding bits, so changing
    // it (e.g. A<->B) can leave the decoded signature identical.
    const i = token.length - 10;
    const flipped = token.slice(0, i) + (token[i] === "A" ? "B" : "A") + token.slice(i + 1);
    expect(await verifySession(secret, flipped)).toBe(false);
  });

  it("rejects sessions signed with another secret and malformed values", async () => {
    const token = await signSession("y".repeat(40), Date.now() + 1000);
    expect(await verifySession(secret, token)).toBe(false);
    expect(await verifySession(secret, undefined)).toBe(false);
    expect(await verifySession(secret, "")).toBe(false);
    expect(await verifySession(secret, "not-a-session")).toBe(false);
    expect(await verifySession(secret, `${Date.now() + 1000}.`)).toBe(false);
  });
});

describe("admin password check", () => {
  it("accepts only the exact password", async () => {
    expect(await passwordMatches("snobi-pass", "snobi-pass")).toBe(true);
    expect(await passwordMatches("snobi-pas", "snobi-pass")).toBe(false);
    expect(await passwordMatches("snobi-pass ", "snobi-pass")).toBe(false);
    expect(await passwordMatches("", "snobi-pass")).toBe(false);
  });

  it("never matches when no password is configured", async () => {
    expect(await passwordMatches("", "")).toBe(false);
  });
});

describe("admin config", () => {
  it("fails closed when secrets are missing or weak", () => {
    expect(adminConfigProblem(undefined, secret)).toMatch(/ADMIN_PASSWORD/);
    expect(adminConfigProblem("pw", undefined)).toMatch(/SESSION_SECRET/);
    expect(adminConfigProblem("pw", "short")).toMatch(/SESSION_SECRET/);
    expect(adminConfigProblem("pw", secret)).toBeNull();
  });
});
