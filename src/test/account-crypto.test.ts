import { describe, expect, it } from "vitest";
import { registerSchema, snobiImageUrl } from "@/lib/account-rules";
import { verifySession } from "@/server/admin/session";
import {
  hashPassword,
  readUserSession,
  signUserSession,
  verifyPassword,
} from "@/server/account/crypto";

const secret = "x".repeat(40);

describe("passwords", () => {
  it("verifies the right password only and salts each hash", async () => {
    const hash = await hashPassword("correct horse", 1000);
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
    expect(await hashPassword("correct horse", 1000)).not.toBe(hash);
    expect(hash).not.toContain("correct");
  });

  it("rejects malformed stored values", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("customer sessions", () => {
  const future = Date.now() + 60_000;

  it("round-trips the user and version", async () => {
    const token = await signUserSession(secret, "user-1", 3, future);
    expect(await readUserSession(secret, token)).toEqual({ userId: "user-1", version: 3 });
  });

  it("rejects expired, tampered, foreign and missing tokens", async () => {
    const token = await signUserSession(secret, "user-1", 1, future);
    expect(await readUserSession(secret, undefined)).toBeNull();
    expect(await readUserSession(secret, "junk")).toBeNull();
    expect(await readUserSession("y".repeat(40), token)).toBeNull();
    expect(await readUserSession(secret, token.replace("user-1", "user-2"))).toBeNull();
    expect(await readUserSession(secret, token.replace(".1.", ".2."))).toBeNull();
    const old = await signUserSession(secret, "user-1", 1, Date.now() - 1);
    expect(await readUserSession(secret, old)).toBeNull();
  });

  it("can't be replayed as an admin session", async () => {
    const token = await signUserSession(secret, "user-1", 1, future);
    const [, , expires, signature] = token.split(".");
    expect(await verifySession(secret, `${expires}.${signature}`)).toBe(false);
    expect(await verifySession(secret, token)).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    snobiOptionId: "tarboush",
    displayName: "Snobi Fan",
    title: "Snobi’s Financial Advisor",
    phone: "+20 101 234 5678",
    password: "long enough",
    isPublic: true,
  };
  const codes = (input: object) => {
    const result = registerSchema.safeParse({ ...valid, ...input });
    return result.success ? [] : result.error.issues.map((i) => i.message);
  };

  it("normalises the phone and allows an empty title", () => {
    const parsed = registerSchema.parse({ ...valid, title: "" });
    expect(parsed.phone).toBe("01012345678");
    expect(parsed.title).toBeNull();
  });

  it("rejects bad input", () => {
    expect(codes({ phone: "123" })).toEqual(["phone_invalid"]);
    expect(codes({ password: "short" })).toEqual(["password_too_short"]);
    expect(codes({ displayName: "www.spam.com" })).toEqual(["display_name_invalid"]);
    expect(codes({ displayName: "Snobi" })).toEqual(["display_name_taken"]);
    expect(codes({ title: "call 0101234567" })).toEqual(["title_invalid"]);
  });
});

describe("snobiImageUrl", () => {
  it("maps built-in and uploaded keys", () => {
    expect(snobiImageUrl("builtin:cap")).toBe("/snobis/cap.png");
    expect(snobiImageUrl("site/snobis/a.png")).toBe("/images/site/snobis/a.png");
  });
});
