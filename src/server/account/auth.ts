import { deleteCookie, getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import {
  snobiImageUrl,
  type AccountError,
  type AccountResult,
  type LoginInput,
  type RegisterInput,
} from "@/lib/account-rules";
import { clientIp } from "../admin/auth";
import { getDb } from "../db/client";
import { loginAttempts, snobiOptions, users } from "../db/schema";
import {
  USER_COOKIE,
  USER_SESSION_TTL_MS,
  hashPassword,
  readUserSession,
  signUserSession,
  verifyPassword,
} from "./crypto";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
// Higher per IP than per number: many customers on one mobile network can share an address.
const MAX_FAILED_PER_IP = 20;
const MAX_FAILED_PER_PHONE = 5;
const MAX_REGISTRATIONS_PER_IP = 10;

// Verified against when the number has no account, so unknown numbers take as long as wrong
// passwords. Computed once per worker instance.
let decoyHash: Promise<string> | undefined;

function sessionSecret() {
  const secret = env.SESSION_SECRET as string | undefined;
  if (!secret) throw new Error("SESSION_SECRET is not set.");
  return secret;
}

async function startSession(userId: string, version: number) {
  const expires = Date.now() + USER_SESSION_TTL_MS;
  setCookie(USER_COOKIE, await signUserSession(sessionSecret(), userId, version, expires), {
    httpOnly: true,
    // Lax, not strict: customers following a link here should still be logged in.
    sameSite: "lax",
    path: "/",
    secure: new URL(getRequest().url).protocol === "https:",
    expires: new Date(expires),
  });
}

export interface CurrentUser {
  id: string;
  phone: string;
  displayName: string;
  title: string | null;
  isPublic: boolean;
  hiddenByAdmin: boolean;
  snobiOptionId: string;
  snobiImageUrl: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readUserSession(sessionSecret(), getCookie(USER_COOKIE));
  if (!session) return null;
  const [row] = await getDb()
    .select({
      id: users.id,
      phone: users.phone,
      displayName: users.displayName,
      title: users.title,
      isPublic: users.isPublic,
      hiddenByAdmin: users.hiddenByAdmin,
      snobiOptionId: users.snobiOptionId,
      imageKey: snobiOptions.imageKey,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .innerJoin(snobiOptions, eq(users.snobiOptionId, snobiOptions.id))
    .where(eq(users.id, session.userId));
  // A bumped version means the password was reset: old cookies stop working.
  if (!row || row.sessionVersion !== session.version) return null;
  const { imageKey, sessionVersion: _version, ...user } = row;
  return { ...user, snobiImageUrl: snobiImageUrl(imageKey) };
}

// Must be the first call in every account server function: they're reachable directly over HTTP.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw redirect({ to: "/join" });
  return user;
}

async function recentAttempts(key: string, windowStart: number) {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, key), gte(loginAttempts.attemptedAt, windowStart)));
  return row?.count ?? 0;
}

export async function registerUser(input: RegisterInput): Promise<AccountResult> {
  const db = getDb();
  const now = Date.now();
  const windowStart = now - ATTEMPT_WINDOW_MS;
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, windowStart));
  const ipKey = `register:${clientIp()}`;
  await db.insert(loginAttempts).values({ ip: ipKey, attemptedAt: now });
  if ((await recentAttempts(ipKey, windowStart)) > MAX_REGISTRATIONS_PER_IP) {
    return { ok: false, error: "too_many_attempts" };
  }

  const [option] = await db
    .select({ id: snobiOptions.id })
    .from(snobiOptions)
    .where(and(eq(snobiOptions.id, input.snobiOptionId), eq(snobiOptions.active, true)));
  if (!option) return { ok: false, error: "snobi_unavailable" };

  const id = crypto.randomUUID();
  try {
    await db.insert(users).values({
      id,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName,
      title: input.title,
      snobiOptionId: option.id,
      isPublic: input.isPublic,
    });
  } catch (error) {
    const text = `${error} ${(error as { cause?: unknown }).cause ?? ""}`;
    if (/UNIQUE constraint failed/i.test(text)) return { ok: false, error: "phone_taken" };
    throw error;
  }
  await startSession(id, 1);
  return { ok: true };
}

export async function loginUser(input: LoginInput): Promise<AccountResult> {
  const db = getDb();
  const now = Date.now();
  const windowStart = now - ATTEMPT_WINDOW_MS;
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, windowStart));

  const ipKey = `login:${clientIp()}`;
  const phoneKey = `phone:${input.phone}`;
  // Recorded before checking the password so parallel guesses can't all slip under the limit.
  await db.insert(loginAttempts).values([
    { ip: ipKey, attemptedAt: now },
    { ip: phoneKey, attemptedAt: now },
  ]);
  const [byIp, byPhone] = await Promise.all([
    recentAttempts(ipKey, windowStart),
    recentAttempts(phoneKey, windowStart),
  ]);
  if (byIp > MAX_FAILED_PER_IP || byPhone > MAX_FAILED_PER_PHONE) {
    return { ok: false, error: "too_many_attempts" };
  }

  const [user] = await db.select().from(users).where(eq(users.phone, input.phone));
  decoyHash ??= hashPassword("decoy password, never matches");
  const matches = await verifyPassword(input.password, user?.passwordHash ?? (await decoyHash));
  if (!user || !matches) return { ok: false, error: "bad_credentials" };

  await db.delete(loginAttempts).where(eq(loginAttempts.ip, phoneKey));
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ipKey));
  await startSession(user.id, user.sessionVersion);
  return { ok: true };
}

// Re-checks the password behind a logged-in session (change password, delete account), rate limited
// so a stolen cookie can't be used to guess it.
export async function verifyCurrentPassword(
  userId: string,
  password: string,
): Promise<{ ok: true; sessionVersion: number } | { ok: false; error: AccountError }> {
  const db = getDb();
  const now = Date.now();
  const windowStart = now - ATTEMPT_WINDOW_MS;
  const key = `account:${userId}`;
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, windowStart));
  await db.insert(loginAttempts).values({ ip: key, attemptedAt: now });
  if ((await recentAttempts(key, windowStart)) > MAX_FAILED_PER_PHONE) {
    return { ok: false, error: "too_many_attempts" };
  }
  const [row] = await db
    .select({ passwordHash: users.passwordHash, sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, userId));
  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    return { ok: false, error: "bad_credentials" };
  }
  await db.delete(loginAttempts).where(eq(loginAttempts.ip, key));
  return { ok: true, sessionVersion: row.sessionVersion };
}

export function logoutUser() {
  deleteCookie(USER_COOKIE, { path: "/" });
  return { ok: true as const };
}

// Keeps the customer logged in on this device after a password change bumped the version.
export function refreshSession(userId: string, version: number) {
  return startSession(userId, version);
}

// Stores a new password and bumps the version, which signs out every other device.
export async function hashAndRefresh(userId: string, password: string, version: number) {
  await getDb()
    .update(users)
    .set({
      passwordHash: await hashPassword(password),
      sessionVersion: version,
      updatedAt: Date.now(),
    })
    .where(eq(users.id, userId));
  await refreshSession(userId, version);
}
