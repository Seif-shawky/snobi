import { redirect } from "@tanstack/react-router";
import {
  deleteCookie,
  getCookie,
  getRequest,
  getRequestIP,
  setCookie,
} from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { loginAttempts } from "../db/schema";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  adminConfigProblem,
  passwordMatches,
  signSession,
  verifySession,
} from "./session";

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export type AdminStatus =
  { state: "ok" } | { state: "logged-out" } | { state: "misconfigured"; message: string };

export type LoginResult = { ok: true } | { ok: false; error: string };

function readConfig() {
  const password = env.ADMIN_PASSWORD as string | undefined;
  const secret = env.SESSION_SECRET as string | undefined;
  const problem = adminConfigProblem(password, secret);
  if (problem || !password || !secret) {
    return { ok: false as const, problem: problem ?? "Admin is not configured." };
  }
  return { ok: true as const, password, secret };
}

export function clientIp() {
  return getRequest().headers.get("cf-connecting-ip") ?? getRequestIP() ?? "unknown";
}

export async function getAdminStatus(): Promise<AdminStatus> {
  const config = readConfig();
  if (!config.ok) return { state: "misconfigured", message: config.problem };
  const valid = await verifySession(config.secret, getCookie(SESSION_COOKIE));
  return valid ? { state: "ok" } : { state: "logged-out" };
}

// Must be the first call in every admin server function: route guards only protect pages,
// while server functions are reachable directly over HTTP.
export async function requireAdmin(): Promise<void> {
  const status = await getAdminStatus();
  if (status.state === "misconfigured") throw new Error(status.message);
  if (status.state !== "ok") throw redirect({ to: "/admin/login" });
}

export async function login(password: string): Promise<LoginResult> {
  const config = readConfig();
  if (!config.ok) return { ok: false, error: config.problem };

  const db = getDb();
  const ip = clientIp();
  const now = Date.now();
  const windowStart = now - ATTEMPT_WINDOW_MS;
  await db.delete(loginAttempts).where(lt(loginAttempts.attemptedAt, windowStart));

  // Record the attempt before checking the password so parallel guesses can't all slip
  // under the limit; D1 serializes writes, so each request sees the ones before it.
  const [attempt] = await db
    .insert(loginAttempts)
    .values({ ip, attemptedAt: now })
    .returning({ id: loginAttempts.id });
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), gte(loginAttempts.attemptedAt, windowStart)));
  const count = row?.count ?? 0;

  if (count > MAX_FAILED_ATTEMPTS) {
    if (attempt) await db.delete(loginAttempts).where(eq(loginAttempts.id, attempt.id));
    return {
      ok: false,
      error: "Too many wrong passwords. Wait 15 minutes, then try again.",
    };
  }

  if (!(await passwordMatches(password, config.password))) {
    const left = MAX_FAILED_ATTEMPTS - count;
    return {
      ok: false,
      error:
        left > 0
          ? `Wrong password. ${left} ${left === 1 ? "try" : "tries"} left before a 15-minute pause.`
          : "Wrong password. Wait 15 minutes, then try again.",
    };
  }

  await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
  const expires = now + SESSION_TTL_MS;
  setCookie(SESSION_COOKIE, await signSession(config.secret, expires), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: new URL(getRequest().url).protocol === "https:",
    expires: new Date(expires),
  });
  return { ok: true };
}

export function logout() {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true as const };
}
